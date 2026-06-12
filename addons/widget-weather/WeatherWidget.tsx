import { FC, useState, useEffect } from 'react';
import { Card, Button } from '../../src/styles/StyledElements';
import { Icon } from '../../src/components/common/Icon';
import { WMO_WEATHER_CODES } from './weather-codes';

interface WeatherWidgetProps {
  settings: {
    latitude?: number;
    longitude?: number;
  };
}

interface WeatherData {
  current: {
    temperature_2m: number;
    weather_code: number;
    precipitation: number;
    shortwave_radiation: number;
    et0_fao_evapotranspiration: number;
    soil_temperature_6cm: number;
    soil_moisture_3_to_9cm: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    is_day: number;
  };
  current_units: {
    precipitation: string;
    shortwave_radiation: string;
    et0_fao_evapotranspiration: string;
    soil_temperature_6cm: string;
    soil_moisture_3_to_9cm: string;
    relative_humidity_2m: string;
    wind_speed_10m: string;
  };
  hourly?: {
    time: string[];
    precipitation: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

interface StatInfo {
  label: string;
  value: string | number;
  interpret?: string;
  colorClass?: string;
  meaning: string;
  statusDesc?: string;
}

const StatItem: FC<{ icon: string; label: string; value: string | number; interpret?: string; colorClass?: string; onClick: () => void }> = ({ icon, label, value, interpret, colorClass, onClick }) => (
  <button onClick={onClick} className="flex flex-col text-left bg-surface-50 dark:bg-surface-800/50 p-2.5 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors w-full active:scale-95 cursor-pointer">
    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1">
      <Icon name={icon} size={12} />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <div className="flex items-baseline justify-between w-full">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</span>
      {interpret && <span className={`text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>{interpret}</span>}
    </div>
  </button>
);

const WeatherWidget: FC<WeatherWidgetProps> = ({ settings }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStat, setSelectedStat] = useState<StatInfo | null>(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);

  useEffect(() => {
    if (!settings || !settings.latitude || !settings.longitude) {
      setError('Latitude and Longitude are not set. Please configure the widget in Settings.');
      setLoading(false);
      return;
    }

    // Attempt to reverse-geocode the coordinates to a city name for display
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${settings.latitude}&longitude=${settings.longitude}&localityLanguage=en`)
      .then(res => res.json())
      .then(data => {
        setLocationName(data.city || data.locality || data.principalSubdivision || null);
      })
      .catch(err => console.error("Failed to fetch location name", err));

    const fetchWeather = async () => {
      if (!navigator.onLine) {
        setError('You are currently offline. Live weather data is unavailable.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${settings.latitude}&longitude=${settings.longitude}&current=temperature_2m,weather_code,precipitation,shortwave_radiation,et0_fao_evapotranspiration,soil_temperature_6cm,soil_moisture_3_to_9cm,relative_humidity_2m,wind_speed_10m,is_day&hourly=precipitation,precipitation_probability,weather_code&past_hours=6&forecast_hours=12&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&temperature_unit=fahrenheit&precipitation_unit=inch&wind_speed_unit=mph&timezone=auto`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.reason || 'Failed to fetch weather data.');
        }
        const data = await res.json();
        setWeather(data);
      } catch (err: any) {
        if (!navigator.onLine || err.message.includes('Failed to fetch')) {
          setError('You are currently offline or the weather service is unreachable.');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [settings]);

  const weatherInfo = weather ? WMO_WEATHER_CODES[weather.current.weather_code] : null;
  const mainIcon = weatherInfo ? (weather?.current?.is_day === 0 ? weatherInfo.icon.replace('sun', 'moon') : weatherInfo.icon) : 'sun';

  // Interpret raw weather data into actionable gardening insights
  const getInterpretations = () => {
    if (!weather) return {};
    const w = weather.current;
    const moist = w.soil_moisture_3_to_9cm * 100;
    
    // Outlook calculation
    let out_t = 'Calm';
    let out_c = 'text-emerald-500';
    let out_v = 'Clear';
    let out_i = w.is_day === 0 ? 'moon' : 'sun';
    let out_desc = 'No significant precipitation recently or expected soon.';

    if (weather.hourly) {
      const pastPrecip = weather.hourly.precipitation.slice(0, 6).reduce((a, b) => a + b, 0);
      const futurePrecip = weather.hourly.precipitation.slice(7).reduce((a, b) => a + b, 0);
      const futureMaxProb = Math.max(...weather.hourly.precipitation_probability.slice(7));
      const futureCodes = weather.hourly.weather_code.slice(7);

      const stormComing = futureCodes.some(c => c >= 95);
      const heavyRainComing = futureCodes.some(c => c === 65 || c === 67 || c === 82);

      const descParts = [];
      if (pastPrecip > 0.05) descParts.push(`Rained ${pastPrecip.toFixed(2)}in recently.`);

      if (stormComing) {
        out_v = 'Storms'; out_t = 'Alert'; out_c = 'text-amber-500'; out_i = 'cloud-lightning';
        descParts.push('Thunderstorms expected later.');
      } else if (heavyRainComing || futurePrecip > 0.3) {
        out_v = 'Heavy Rain'; out_t = 'Alert'; out_c = 'text-blue-500'; out_i = 'cloud-rain';
        descParts.push('Heavy rain expected later.');
      } else if (futureMaxProb >= 60) {
        out_v = 'Rain Likely'; out_t = 'Watch'; out_c = 'text-blue-400'; out_i = 'cloud-drizzle';
        descParts.push(`${Math.round(futureMaxProb)}% chance of rain later.`);
      } else if (futureMaxProb >= 30) {
        out_v = 'Chance of Rain'; out_t = 'Notice'; out_c = 'text-blue-400'; out_i = 'cloud-drizzle';
        descParts.push(`${Math.round(futureMaxProb)}% chance of rain later.`);
      } else if (pastPrecip > 0.05) {
        out_v = 'Recent Rain'; out_t = 'Wet'; out_c = 'text-blue-500'; out_i = 'droplets';
      }

      if (descParts.length > 0) out_desc = descParts.join(' ');
    }

    return {
      wind: w.wind_speed_10m > 15 ? { t: 'Strong', c: 'text-red-500', desc: 'High winds can snap tall plants and rapidly dry out leaves.' } : w.wind_speed_10m > 8 ? { t: 'Breezy', c: 'text-amber-400', desc: 'Moderate wind increases water loss. Keep an eye on hydration.' } : { t: 'Calm', c: 'text-emerald-500', desc: 'Ideal wind conditions for plant stability and minimal water loss.' },
      hum: w.relative_humidity_2m > 70 ? { t: 'Rot Risk', c: 'text-amber-500', desc: 'High humidity slows evaporation and increases the risk of fungal diseases like powdery mildew.' } : w.relative_humidity_2m < 30 ? { t: 'Dry', c: 'text-amber-500', desc: 'Low humidity can cause leaf crisping and rapid water loss. Consider misting or extra watering.' } : { t: 'Optimal', c: 'text-emerald-500', desc: 'Perfect humidity levels for most standard vegetable and herb growth.' },
      precip: w.precipitation > 0.5 ? { t: 'Heavy', c: 'text-blue-500', desc: 'Heavy rain is falling. Check for soil washout and ensure pots are draining properly.' } : w.precipitation > 0.1 ? { t: 'Moderate', c: 'text-blue-400', desc: 'Moderate rain. Your garden is getting a good natural soaking.' } : w.precipitation > 0 ? { t: 'Light', c: 'text-blue-300', desc: 'Light drizzle. May not penetrate deep into the root zone.' } : { t: 'None', c: 'text-slate-400', desc: 'No precipitation currently.' },
      soilT: w.soil_temperature_6cm > 85 ? { t: 'Hot', c: 'text-red-500', desc: 'Soil is very hot. Roots may be stressed. Consider adding mulch to cool the ground.' } : w.soil_temperature_6cm < 50 ? { t: 'Cold', c: 'text-blue-500', desc: 'Soil is cold. Seeds will struggle to germinate and warm-weather crops may stunt.' } : { t: 'Optimal', c: 'text-emerald-500', desc: 'Excellent soil temperature for active root growth and nutrient uptake.' },
      moist: moist > 80 ? { t: 'Saturated', c: 'text-blue-500', desc: 'Soil is waterlogged. Hold off on watering to prevent root rot.' } : moist < 20 ? { t: 'Very Dry', c: 'text-red-500', desc: 'Soil is dangerously dry at the root level. Water immediately.' } : moist < 40 ? { t: 'Monitor', c: 'text-amber-500', desc: 'Soil moisture is dropping. Plan to water soon depending on the plant type.' } : { t: 'Optimal', c: 'text-emerald-500', desc: 'Perfect moisture balance for healthy root respiration and drinking.' },
      rad: w.shortwave_radiation > 600 ? { t: 'Intense', c: 'text-amber-500', desc: 'Very strong sunlight. Great for fruiting crops but may scorch delicate shade-lovers.' } : w.shortwave_radiation > 200 ? { t: 'Moderate', c: 'text-emerald-500', desc: 'Good, healthy sunlight levels for general photosynthesis.' } : { t: 'Low', c: 'text-slate-400', desc: 'Overcast or dim conditions. Photosynthesis is slowed.' },
      et: w.et0_fao_evapotranspiration > 0.2 ? { t: 'High Loss', c: 'text-red-500', desc: 'Sun and wind are sucking moisture out of your plants and soil rapidly. Extra water needed.' } : w.et0_fao_evapotranspiration > 0.1 ? { t: 'Mod Loss', c: 'text-amber-500', desc: 'Moderate evaporation. Plants are drinking and transpiring at a normal active rate.' } : { t: 'Low Loss', c: 'text-emerald-500', desc: 'Very little water is being lost to the air today.' },
      outlook: { t: out_t, c: out_c, v: out_v, i: out_i, desc: out_desc }
    };
  };

  const interp = getInterpretations();

  // Synthesize all metrics into a single overarching garden recommendation
  const getGardenSummary = () => {
    if (!weather) return { text: "Loading insights...", icon: "sparkles", color: "text-slate-500" };
    
    const alerts: { text: string, severity: number, icon: string, color: string }[] = [];

    // Critical Level (2)
    if (interp.moist?.t === 'Very Dry') alerts.push({ text: "Soil moisture is critically low. Immediate deep watering is highly recommended.", severity: 2, icon: "droplets", color: "text-red-500" });
    if (interp.wind?.t === 'Strong') alerts.push({ text: "High winds can snap plants. Secure tall crops and monitor for rapid drying.", severity: 2, icon: "wind", color: "text-red-500" });
    if (interp.outlook?.v === 'Storms' || interp.outlook?.v === 'Heavy Rain') alerts.push({ text: "Storms or heavy rain expected. Hold off on watering and ensure good drainage.", severity: 2, icon: "cloud-lightning", color: "text-amber-500" });
    
    // Warning Level (1)
    if (interp.rad?.t === 'Intense') alerts.push({ text: "Intense solar radiation. Delicate shade-lovers may scorch.", severity: 1, icon: "sun", color: "text-amber-500" });
    if (interp.et?.t === 'High Loss' || interp.soilT?.t === 'Hot') alerts.push({ text: "High heat and evaporation today. Plants will lose water quickly.", severity: 1, icon: "arrow-up", color: "text-amber-500" });
    if (interp.outlook?.v === 'Rain Likely') alerts.push({ text: "Rain is likely soon. You may want to delay manual watering.", severity: 1, icon: "cloud-drizzle", color: "text-blue-500" });
    if (interp.hum?.t === 'Rot Risk') alerts.push({ text: "High humidity increases the risk of fungal diseases. Ensure good airflow.", severity: 1, icon: "alert-triangle", color: "text-amber-500" });
    if (interp.soilT?.t === 'Cold') alerts.push({ text: "Soil temperatures are cold. Seed germination will be slow.", severity: 1, icon: "snowflake", color: "text-blue-500" });
    
    // Info Level (0)
    if (interp.outlook?.v === 'Chance of Rain') alerts.push({ text: "There is a chance of rain later today. Check conditions before watering.", severity: 0, icon: "cloud-drizzle", color: "text-blue-400" });
    if (interp.outlook?.v === 'Recent Rain') alerts.push({ text: "Recent rainfall detected. Check soil moisture before adding more water.", severity: 0, icon: "droplet", color: "text-emerald-500" });

    if (alerts.length === 0) {
      return { text: "Conditions are generally favorable! Keep up with your standard care routine.", icon: "check-circle", color: "text-emerald-500" };
    }

    // Sort by most severe, take the top 3, and join them into a paragraph
    alerts.sort((a, b) => b.severity - a.severity);
    const topAlerts = alerts.slice(0, 3);
    const text = topAlerts.map(a => a.text).join(' ');

    // Use the color and icon of the highest severity alert to theme the card
    return { text, icon: topAlerts[0].icon, color: topAlerts[0].color };
  };
  const summary = getGardenSummary();

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Icon name="cloud-sun" size={18} />
          {locationName ? `${locationName} Weather` : 'Local Weather'}
        </h3>
        {loading && <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>}
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700 text-center gap-2">
          <Icon name="wifi-off" size={24} className="text-slate-400" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Weather Unavailable</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
        </div>
      )}

      {weather && weatherInfo && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-6 pt-4 pb-2">
            <div className="flex flex-col items-center gap-1">
              <Icon name={mainIcon as any} size={48} className={weather.current.is_day === 0 ? "text-indigo-400 dark:text-indigo-300" : "text-amber-500"} />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">{weatherInfo.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tighter">
                {Math.round(weather.current.temperature_2m)}°
              </div>
              {weather.daily && (
                <div className="flex flex-col items-start gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 border-l border-surface-200 dark:border-surface-700 pl-4 py-1">
                  <div className="flex items-center gap-1">
                    <Icon name="up" size={12} className="text-red-400" /> <span className="w-5 text-left">{Math.round(weather.daily.temperature_2m_max[0])}°</span>
                    <Icon name="down" size={12} className="text-blue-400 ml-1" /> <span className="w-5 text-left">{Math.round(weather.daily.temperature_2m_min[0])}°</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icon name="cloud-rain" size={12} className="text-blue-400" /> 
                    <span>{weather.hourly ? Math.max(...weather.hourly.precipitation_probability.slice(6)) : 0}% Rain</span>
                  </div>
                  {(weather.daily.temperature_2m_min[0] <= 32 || weather.current.temperature_2m <= 32) ? (
                    <div className="flex items-center gap-1.5 text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded w-full">
                      <Icon name="snowflake" size={10} /> Freeze Alert
                    </div>
                  ) : weather.daily.temperature_2m_max[0] >= 90 && (
                    <div className="flex items-center gap-1.5 text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded w-full">
                      <Icon name="sun" size={10} /> Heat Alert
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div 
            className="bg-surface-50 dark:bg-surface-800/50 p-3 rounded-xl border border-surface-200 dark:border-surface-700 flex gap-3 items-center cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors active:scale-[0.98]" 
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          >
            <div className={`${summary.color} flex-shrink-0`}><Icon name={summary.icon as any} size={24} /></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Garden Outlook</p>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">{summary.text}</p>
              <div className="flex justify-end mt-1">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-0.5">
                {isDetailsExpanded ? 'Tap to close' : 'Tap for details'} <Icon name="info" className='ml-1' size={10} />
                </span>
              </div>
            </div>
            <div className="text-slate-400 flex-shrink-0 transition-transform duration-200">
              <Icon name={isDetailsExpanded ? 'chevron-up' : 'chevron-down'} size={20} />
            </div>
          </div>

          {isDetailsExpanded && (
            <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-surface-200 dark:border-surface-700 animate-in slide-in-from-top-2 fade-in duration-200">
            <StatItem icon="droplet" label="Humidity" value={`${weather.current.relative_humidity_2m}${weather.current_units.relative_humidity_2m}`} interpret={interp.hum?.t} colorClass={interp.hum?.c} onClick={() => setSelectedStat({ label: 'Humidity', value: `${weather.current.relative_humidity_2m}${weather.current_units.relative_humidity_2m}`, interpret: interp.hum?.t, colorClass: interp.hum?.c, meaning: 'Relative humidity measures the amount of moisture present in the air compared to the maximum it could hold at the current temperature.', statusDesc: interp.hum?.desc })} />
            <StatItem icon="wind" label="Wind" value={`${weather.current.wind_speed_10m} ${weather.current_units.wind_speed_10m}`} interpret={interp.wind?.t} colorClass={interp.wind?.c} onClick={() => setSelectedStat({ label: 'Wind', value: `${weather.current.wind_speed_10m} ${weather.current_units.wind_speed_10m}`, interpret: interp.wind?.t, colorClass: interp.wind?.c, meaning: 'Measures the current wind speed at 10 meters above ground.', statusDesc: interp.wind?.desc })} />
            <StatItem icon="cloud-rain" label="Rain Vol." value={`${weather.current.precipitation} ${weather.current_units.precipitation}`} interpret={interp.precip?.t} colorClass={interp.precip?.c} onClick={() => setSelectedStat({ label: 'Rain Volume', value: `${weather.current.precipitation} ${weather.current_units.precipitation}`, interpret: interp.precip?.t, colorClass: interp.precip?.c, meaning: 'The total physical volume of liquid precipitation (rain, showers, etc.) falling in the current hour.', statusDesc: interp.precip?.desc })} />
            <StatItem icon="thermometer" label="Soil Temp" value={`${Math.round(weather.current.soil_temperature_6cm)}${weather.current_units.soil_temperature_6cm}`} interpret={interp.soilT?.t} colorClass={interp.soilT?.c} onClick={() => setSelectedStat({ label: 'Soil Temperature', value: `${Math.round(weather.current.soil_temperature_6cm)}${weather.current_units.soil_temperature_6cm}`, interpret: interp.soilT?.t, colorClass: interp.soilT?.c, meaning: 'The physical temperature of the ground at a 6cm depth, which is the critical zone for root health and seed germination.', statusDesc: interp.soilT?.desc })} />
            <StatItem icon="droplets" label="Soil Moisture" value={`${Math.round(weather.current.soil_moisture_3_to_9cm * 100)}%`} interpret={interp.moist?.t} colorClass={interp.moist?.c} onClick={() => setSelectedStat({ label: 'Soil Moisture', value: `${Math.round(weather.current.soil_moisture_3_to_9cm * 100)}%`, interpret: interp.moist?.t, colorClass: interp.moist?.c, meaning: 'The percentage of the soil\'s volume that is made up of water at the 3-9cm root depth.', statusDesc: interp.moist?.desc })} />
            <StatItem icon="sun" label="Radiation" value={`${weather.current.shortwave_radiation} ${weather.current_units.shortwave_radiation}`} interpret={interp.rad?.t} colorClass={interp.rad?.c} onClick={() => setSelectedStat({ label: 'Solar Radiation', value: `${weather.current.shortwave_radiation} ${weather.current_units.shortwave_radiation}`, interpret: interp.rad?.t, colorClass: interp.rad?.c, meaning: 'Shortwave solar radiation measures the intensity of the sunlight hitting your garden, driving photosynthesis.', statusDesc: interp.rad?.desc })} />
            <StatItem icon="arrow-up" label="Water Loss" value={`${weather.current.et0_fao_evapotranspiration} ${weather.current_units.et0_fao_evapotranspiration}`} interpret={interp.et?.t} colorClass={interp.et?.c} onClick={() => setSelectedStat({ label: 'Water Loss (Evapotranspiration)', value: `${weather.current.et0_fao_evapotranspiration} ${weather.current_units.et0_fao_evapotranspiration}`, interpret: interp.et?.t, colorClass: interp.et?.c, meaning: 'Evapotranspiration (ET0) is the calculated rate at which water is evaporating from the soil and transpiring (sweating) out of plant leaves.', statusDesc: interp.et?.desc })} />
            <StatItem icon={interp.outlook?.i || (weather.current.is_day === 0 ? 'moon' : 'sun')} label="Outlook" value={interp.outlook?.v || 'Clear'} interpret={interp.outlook?.t} colorClass={interp.outlook?.c} onClick={() => setSelectedStat({ label: 'Precipitation Outlook', value: interp.outlook?.v || 'Clear', interpret: interp.outlook?.t, colorClass: interp.outlook?.c, meaning: 'A combined forecast monitoring the past 6 hours of recent rain and the upcoming 12 hours of potential storms.', statusDesc: interp.outlook?.desc })} />
          </div>
          )}
        </div>
      )}

      {selectedStat && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedStat(null)}
        >
          <Card 
            className="w-full max-w-sm shadow-2xl flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{selectedStat.label}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-light text-slate-700 dark:text-slate-200">{selectedStat.value}</span>
                  {selectedStat.interpret && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 ${selectedStat.colorClass}`}>
                      {selectedStat.interpret}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedStat(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors">
                <Icon name="x" size={20} />
              </button>
            </div>

            <div className="space-y-4 mt-2">
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">What is this?</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedStat.meaning}</p>
              </div>
              {selectedStat.statusDesc && (
                <div className="p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700">
                  <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Current Status</h4>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{selectedStat.statusDesc}</p>
                </div>
              )}
            </div>
            
            <Button $variant="secondary" onClick={() => setSelectedStat(null)} className="mt-2 w-full justify-center">Close</Button>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default WeatherWidget;