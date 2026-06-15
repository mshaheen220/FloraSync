import { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Button } from '../../src/styles/StyledElements';
import { Icon } from '../../src/components/common/Icon';
import { TOMORROW_WEATHER_CODES, INTERP_RULES, evaluateMetric, evaluateOutlook } from './weather-utils';

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
    relative_humidity_2m: number;
    wind_speed_10m: number;
    cloud_cover: number;
    uv_index: number;
    is_day: number;
  };
  current_units: {
    precipitation: string;
    relative_humidity_2m: string;
    wind_speed_10m: string;
    cloud_cover: string;
    uv_index: string;
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch location name in a separate effect to avoid triggering weather fetches unnecessarily
  useEffect(() => {
    if (settings?.latitude && settings?.longitude && !locationName) {
      fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${settings.latitude}&longitude=${settings.longitude}&localityLanguage=en`)
        .then(res => res.json())
        .then(data => setLocationName(data.city || data.locality || data.principalSubdivision || null))
        .catch(err => console.error("Failed to fetch location name", err));
    }
  }, [settings?.latitude, settings?.longitude]);

  useEffect(() => {
    if (!settings || !settings.latitude || !settings.longitude) {
      setError('Latitude and Longitude are not set. Please configure the widget in Settings.');
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      if (!navigator.onLine) {
        setError('You are currently offline. Live weather data is unavailable.');
        setLoading(false);
        return;
      }

      const CACHE_MINUTES = 15;
      const CACHE_KEY = `florasync_weather_${settings.latitude}_${settings.longitude}`;

      try {
        const cachedDataStr = localStorage.getItem(CACHE_KEY);
        if (cachedDataStr) {
          const cached = JSON.parse(cachedDataStr);
          if (new Date().getTime() - cached.timestamp < CACHE_MINUTES * 60 * 1000) {
            setWeather(cached.data);
            setLastUpdated(new Date(cached.timestamp));
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        // Ignore parsing errors and fetch fresh data
      }

      setLoading(true);
      setError(null);
      try {
        // Vite requires environment variables to be prefixed with VITE_ to be available on the client
        const apiKey = import.meta.env.VITE_TOMORROW_IO_API_KEY;
        if (!apiKey) {
          throw new Error('Tomorrow.io API Key is missing. Ensure your .env file uses VITE_TOMORROW_IO_API_KEY.');
        }

        // Using the forecast endpoint instead of /locations to retrieve actual weather metrics
        const url = `https://api.tomorrow.io/v4/weather/forecast?location=${settings.latitude},${settings.longitude}&apikey=${apiKey}&units=imperial`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch Tomorrow.io data.');
        }
        
        const tomorrowData = await res.json();
        const timelines = tomorrowData.timelines || {};
        const hourly = timelines.hourly || [];
        const daily = timelines.daily || [];
        const currentVals = hourly[0]?.values || {};

        // Pad 6 hours of empty historical data to prevent breaking the "Recent Rain" insight calculation
        const hourlyTime = Array(6).fill("");
        const hourlyPrecip = Array(6).fill(0);
        const hourlyPrecipProb = Array(6).fill(0);
        const hourlyCode = Array(6).fill(0);

        hourly.slice(0, 13).forEach((h: any) => {
          hourlyTime.push(h.time);
          hourlyPrecip.push(h.values.precipitationIntensity || 0);
          hourlyPrecipProb.push(h.values.precipitationProbability || 0);
        hourlyCode.push(h.values.weatherCode || 0);
        });

        const mappedData: WeatherData = {
          current: {
            temperature_2m: currentVals.temperature || 0,
          weather_code: currentVals.weatherCode || 0,
            precipitation: currentVals.precipitationIntensity || 0,
            relative_humidity_2m: currentVals.humidity || 0,
            wind_speed_10m: currentVals.windSpeed || 0,
            cloud_cover: currentVals.cloudCover || 0,
            uv_index: currentVals.uvIndex || 0,
            is_day: (new Date().getHours() >= 6 && new Date().getHours() <= 20) ? 1 : 0
          },
          current_units: {
            precipitation: 'in', relative_humidity_2m: '%', wind_speed_10m: 'mph', cloud_cover: '%', uv_index: ''
          },
          hourly: {
            time: hourlyTime, precipitation: hourlyPrecip,
            precipitation_probability: hourlyPrecipProb, weather_code: hourlyCode
          },
          daily: {
            time: daily.map((d: any) => d.time),
            temperature_2m_max: daily.map((d: any) => d.values.temperatureMax || 0),
            temperature_2m_min: daily.map((d: any) => d.values.temperatureMin || 0)
          }
        };

        const now = new Date();
        // Cache the mapped data scoped to this specific location
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: now.getTime(),
          data: mappedData
        }));

        setWeather(mappedData);
        setLastUpdated(now);
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
  }, [settings, refreshTrigger]);

  const handleRefresh = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (settings.latitude && settings.longitude) {
      const CACHE_KEY = `florasync_weather_${settings.latitude}_${settings.longitude}`;
      localStorage.removeItem(CACHE_KEY);
    }
    setRefreshTrigger(prev => prev + 1);
  }, [settings.latitude, settings.longitude]);

  const weatherInfo = weather ? TOMORROW_WEATHER_CODES[weather.current.weather_code] : null;
  const mainIcon = weatherInfo ? (weather?.current?.is_day === 0 ? weatherInfo.icon.replace('sun', 'moon') : weatherInfo.icon) : 'sun';
  const mainDesc = weatherInfo ? (weather?.current?.is_day === 0 ? weatherInfo.description.replace(', Sunny', '') : weatherInfo.description) : '';

  // Memoize heavy logic so it doesn't recalculate on every minor state change (like opening modals)
  const interp = useMemo(() => {
    if (!weather) return {} as Record<string, any>;
    const w = weather.current;
    
    // Outlook calculation
    let outlookResult = { t: 'Calm', c: 'text-emerald-500', v: 'Clear', i: w.is_day === 0 ? 'moon' : 'sun', desc: 'No significant precipitation recently or expected soon.' };

    if (weather.hourly) {
      const pastPrecip = weather.hourly.precipitation.slice(0, 6).reduce((a, b) => a + b, 0);
      const futurePrecip = weather.hourly.precipitation.slice(7).reduce((a, b) => a + b, 0);
      const futureMaxProb = Math.max(...weather.hourly.precipitation_probability.slice(7));
      const futureCodes = weather.hourly.weather_code.slice(7);

      const stormComing = futureCodes.some(c => c === 8000);
      const heavyRainComing = futureCodes.some(c => c === 4201 || c === 6201 || c === 4001 || c === 6001);

      outlookResult = evaluateOutlook({
        stormComing,
        heavyRainComing,
        futurePrecip,
        futureMaxProb,
        pastPrecip,
        isDay: w.is_day
      });
    }

    return {
      wind: evaluateMetric(w.wind_speed_10m, INTERP_RULES.wind),
      hum: evaluateMetric(w.relative_humidity_2m, INTERP_RULES.hum),
      precip: evaluateMetric(w.precipitation, INTERP_RULES.precip),
      uv: evaluateMetric(w.uv_index, INTERP_RULES.uv),
      cloud: evaluateMetric(w.cloud_cover, INTERP_RULES.cloud),
      outlook: outlookResult
    };
  }, [weather]);

  const summary = useMemo(() => {
    if (!weather) return { text: "Loading insights...", icon: "sparkles", color: "text-slate-500" };
    
    const alerts: { text: string, severity: number, icon: string, color: string }[] = [];

    // Critical Level (2)
    if (interp.wind?.t === 'Strong') alerts.push({ text: "High winds can snap plants. Secure tall crops and monitor for rapid drying.", severity: 2, icon: "wind", color: "text-red-500" });
    if (interp.outlook?.v === 'Storms' || interp.outlook?.v === 'Heavy Rain') alerts.push({ text: "Storms or heavy rain expected. Hold off on watering and ensure good drainage.", severity: 2, icon: "cloud-lightning", color: "text-amber-500" });
    
    // Warning Level (1)
    if (interp.uv?.t === 'Extreme') alerts.push({ text: "Extreme UV levels today. Consider providing temporary shade for delicate seedlings.", severity: 1, icon: "sun", color: "text-red-500" });
    if (interp.outlook?.v === 'Rain Likely') alerts.push({ text: "Rain is likely soon. You may want to delay manual watering.", severity: 1, icon: "cloud-drizzle", color: "text-blue-500" });
    if (interp.hum?.t === 'Rot Risk') alerts.push({ text: "High humidity increases the risk of fungal diseases. Ensure good airflow.", severity: 1, icon: "alert-triangle", color: "text-amber-500" });
    
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
  }, [weather, interp]);

  const statsList = useMemo(() => {
    return weather ? [
      {
      icon: "droplet",
      label: "Humidity",
      value: `${weather.current.relative_humidity_2m}${weather.current_units.relative_humidity_2m}`,
      interpret: interp.hum?.t,
      colorClass: interp.hum?.c,
      meaning: 'Relative humidity affects how plants breathe. High humidity slows water loss but increases fungal rot risk, while low humidity causes rapid transpiration and dry soil.',
      statusDesc: interp.hum?.desc
    },
    {
      icon: "wind",
      label: "Wind",
      value: `${weather.current.wind_speed_10m} ${weather.current_units.wind_speed_10m}`,
      interpret: interp.wind?.t,
      colorClass: interp.wind?.c,
      meaning: 'Wind increases the rate of evaporation from both the soil and plant leaves. High winds can rapidly dehydrate plants and physically damage tall or heavy-fruiting crops.',
      statusDesc: interp.wind?.desc
    },
    {
      icon: "cloud-rain",
      label: "Rain Vol.",
      modalLabel: "Rain Volume",
      value: `${weather.current.precipitation} ${weather.current_units.precipitation}`,
      interpret: interp.precip?.t,
      colorClass: interp.precip?.c,
      meaning: 'The volume of liquid precipitation falling this hour. A good benchmark is that 1 inch of natural rain per week generally satisfies the needs of most established garden beds.',
      statusDesc: interp.precip?.desc
    },
    {
      icon: "sun",
      label: "UV Index",
      value: `${weather.current.uv_index}`,
      interpret: interp.uv?.t,
      colorClass: interp.uv?.c,
      meaning: 'Measures the strength of ultraviolet rays. While sunlight is necessary, extreme UV levels can cause sunburn or leaf scorch, especially on tender seedlings or newly transplanted crops.',
      statusDesc: interp.uv?.desc
    },
    {
      icon: "cloud",
      label: "Cloud Cover",
      value: `${weather.current.cloud_cover}${weather.current_units.cloud_cover}`,
      interpret: interp.cloud?.t,
      colorClass: interp.cloud?.c,
      meaning: 'The percentage of the sky obscured by clouds. Heavy cloud cover slows down photosynthesis and drastically reduces the rate at which soil dries out.',
      statusDesc: interp.cloud?.desc
    },
    {
      icon: interp.outlook?.i || (weather.current.is_day === 0 ? 'moon' : 'sun'),
      label: "Outlook",
      modalLabel: "Precipitation Outlook",
      value: interp.outlook?.v || 'Clear',
      interpret: interp.outlook?.t,
      colorClass: interp.outlook?.c,
      meaning: 'A smart snapshot combining recent rainfall over the past 6 hours with a 12-hour forward look at impending storms, helping you decide if you should water now or wait.',
      statusDesc: interp.outlook?.desc
    }
    ] : [];
  }, [weather, interp]);

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
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">{mainDesc}</p>
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
              {statsList.map((stat, idx) => (
                <StatItem 
                  key={idx}
                  icon={stat.icon} 
                  label={stat.label} 
                  value={stat.value} 
                  interpret={stat.interpret} 
                  colorClass={stat.colorClass} 
                  onClick={() => setSelectedStat({ 
                    label: stat.modalLabel || stat.label, 
                    value: stat.value, 
                    interpret: stat.interpret, 
                    colorClass: stat.colorClass, 
                    meaning: stat.meaning, 
                    statusDesc: stat.statusDesc 
                  })} 
                />
              ))}
            
            <div className="col-span-2 flex flex-row items-center justify-between bg-transparent px-3 py-1.5 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-700 w-full opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <Icon name="clock" size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Updated</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '---'}
                </span>
                <button onClick={handleRefresh} disabled={loading} className="p-1 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 bg-surface-100 hover:bg-primary-50 dark:bg-surface-800 dark:hover:bg-primary-900/30 rounded-full transition-colors active:scale-95 disabled:opacity-50 shadow-sm" title="Refresh weather data">
                  <Icon name="refresh" size={12} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>
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