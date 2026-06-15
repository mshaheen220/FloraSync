export const TOMORROW_WEATHER_CODES: { [key: number]: { description: string; icon: string } } = {
  0: { description: 'Unknown', icon: 'help-circle' },
  1000: { description: 'Clear, Sunny', icon: 'sun' },
  1100: { description: 'Mostly Clear', icon: 'sun' },
  1101: { description: 'Partly Cloudy', icon: 'cloud-sun' },
  1102: { description: 'Mostly Cloudy', icon: 'cloud' },
  1001: { description: 'Cloudy', icon: 'cloud' },
  2000: { description: 'Fog', icon: 'cloud-fog' },
  2100: { description: 'Light Fog', icon: 'cloud-fog' },
  4000: { description: 'Drizzle', icon: 'cloud-drizzle' },
  4001: { description: 'Rain', icon: 'cloud-rain' },
  4200: { description: 'Light Rain', icon: 'cloud-rain' },
  4201: { description: 'Heavy Rain', icon: 'cloud-rain' },
  5000: { description: 'Snow', icon: 'cloud-snow' },
  5001: { description: 'Flurries', icon: 'cloud-snow' },
  5100: { description: 'Light Snow', icon: 'cloud-snow' },
  5101: { description: 'Heavy Snow', icon: 'cloud-snow' },
  6000: { description: 'Freezing Drizzle', icon: 'cloud-drizzle' },
  6001: { description: 'Freezing Rain', icon: 'cloud-rain' },
  6200: { description: 'Light Freezing Rain', icon: 'cloud-rain' },
  6201: { description: 'Heavy Freezing Rain', icon: 'cloud-rain' },
  7000: { description: 'Ice Pellets', icon: 'cloud-snow' },
  7101: { description: 'Heavy Ice Pellets', icon: 'cloud-snow' },
  7102: { description: 'Light Ice Pellets', icon: 'cloud-snow' },
  8000: { description: 'Thunderstorm', icon: 'cloud-lightning' }
};

export type MetricRule = {
  check: (v: number) => boolean;
  t: string;
  c: string;
  desc: string;
};

export const evaluateMetric = (val: number, rules: MetricRule[]) => {
  const match = rules.find(r => r.check(val)) || rules[rules.length - 1];
  return { t: match.t, c: match.c, desc: match.desc };
};

// Easy-to-edit configuration arrays for weather interpretations
export const INTERP_RULES: Record<string, MetricRule[]> = {
  wind: [
    { check: v => v > 15, t: 'Strong', c: 'text-red-500', desc: 'High winds can snap tall plants and rapidly dry out leaves. Ensure tall crops are staked and check soil moisture frequently.' },
    { check: v => v > 8, t: 'Breezy', c: 'text-amber-400', desc: 'Moderate wind increases water loss. Keep an eye on hydration, especially for potted plants.' },
    { check: () => true, t: 'Calm', c: 'text-emerald-500', desc: 'Ideal wind conditions for plant stability and minimal water loss. No special action needed.' }
  ],
  hum: [
    { check: v => v > 70, t: 'Rot Risk', c: 'text-amber-500', desc: 'High humidity slows evaporation and increases the risk of fungal diseases like powdery mildew. Ensure good airflow around dense foliage.' },
    { check: v => v < 30, t: 'Dry', c: 'text-amber-500', desc: 'Low humidity can cause leaf crisping and rapid water loss. Consider misting or providing extra water to sensitive plants.' },
    { check: () => true, t: 'Optimal', c: 'text-emerald-500', desc: 'Perfect humidity levels for most standard vegetable and herb growth. Maintain normal care.' }
  ],
  precip: [
    { check: v => v > 0.5, t: 'Heavy', c: 'text-blue-500', desc: 'Heavy rain is falling. Delay manual watering, check for soil washout, and ensure pots are draining properly.' },
    { check: v => v > 0.1, t: 'Moderate', c: 'text-blue-400', desc: 'Moderate rain. Your garden is getting a good natural soaking. Delay manual watering.' },
    { check: v => v > 0, t: 'Light', c: 'text-blue-300', desc: 'Light drizzle. May not penetrate deep into the root zone. Check soil moisture before skipping manual watering.' },
    { check: () => true, t: 'None', c: 'text-slate-400', desc: 'No precipitation currently. Follow your standard watering schedule.' }
  ],
  rad: [
    { check: v => v > 600, t: 'Intense', c: 'text-amber-500', desc: 'Very strong sunlight. Great for fruiting crops but may scorch delicate shade-lovers. Monitor soil dryness.' },
    { check: v => v > 200, t: 'Moderate', c: 'text-emerald-500', desc: 'Good, healthy sunlight levels for general photosynthesis. Ideal growing conditions.' },
    { check: () => true, t: 'Low', c: 'text-slate-400', desc: 'Overcast or dim conditions. Photosynthesis is slowed, and soil will dry out less quickly.' }
  ],
  uv: [
    { check: v => v >= 8, t: 'Extreme', c: 'text-red-500', desc: 'Extreme UV radiation. High risk of leaf scorch for tender plants or fresh transplants. Consider providing temporary shade.' },
    { check: v => v >= 6, t: 'High', c: 'text-amber-500', desc: 'High UV index. Great for established sun-loving crops, but can dry out topsoil quickly.' },
    { check: () => true, t: 'Moderate', c: 'text-emerald-500', desc: 'Safe, moderate UV levels. Sunlight is healthy without high risk of sunburn.' }
  ],
  cloud: [
    { check: v => v >= 80, t: 'Overcast', c: 'text-slate-500', desc: 'Thick cloud cover. Photosynthesis will be reduced and soil will dry slower. You may not need to water as soon.' },
    { check: v => v >= 30, t: 'Partly Cloudy', c: 'text-blue-400', desc: 'A good mix of sun and shade for the garden. Standard care applies.' },
    { check: () => true, t: 'Clear', c: 'text-amber-400', desc: 'Clear skies. Maximum sun exposure. Expect faster evaporation and check thirsty plants.' }
  ]
};

export type OutlookConditions = {
  stormComing: boolean;
  heavyRainComing: boolean;
  futurePrecip: number;
  futureMaxProb: number;
  pastPrecip: number;
  isDay: number;
};

export type OutlookRule = {
  check: (c: OutlookConditions) => boolean;
  v: string;
  t: string;
  c: string;
  i: string | ((c: OutlookConditions) => string);
  desc: string | ((c: OutlookConditions) => string);
};

export const OUTLOOK_RULES: OutlookRule[] = [
  { check: c => c.stormComing, v: 'Storms', t: 'Alert', c: 'text-amber-500', i: 'cloud-lightning', desc: 'Thunderstorms expected later.' },
  { check: c => c.heavyRainComing || c.futurePrecip > 0.3, v: 'Heavy Rain', t: 'Alert', c: 'text-blue-500', i: 'cloud-rain', desc: 'Heavy rain expected later.' },
  { check: c => c.futureMaxProb >= 60, v: 'Rain Likely', t: 'Watch', c: 'text-blue-400', i: 'cloud-drizzle', desc: c => `${Math.round(c.futureMaxProb)}% chance of rain later.` },
  { check: c => c.futureMaxProb >= 30, v: 'Chance of Rain', t: 'Notice', c: 'text-blue-400', i: 'cloud-drizzle', desc: c => `${Math.round(c.futureMaxProb)}% chance of rain later.` },
  { check: c => c.pastPrecip > 0.05, v: 'Recent Rain', t: 'Wet', c: 'text-blue-500', i: 'droplets', desc: '' },
  { check: () => true, v: 'Clear', t: 'Calm', c: 'text-emerald-500', i: c => c.isDay === 0 ? 'moon' : 'sun', desc: 'No significant precipitation recently or expected soon.' }
];

export const evaluateOutlook = (conds: OutlookConditions) => {
  const match = OUTLOOK_RULES.find(r => r.check(conds)) || OUTLOOK_RULES[OUTLOOK_RULES.length - 1];
  
  const descParts = [];
  if (conds.pastPrecip > 0.05) descParts.push(`Rained ${conds.pastPrecip.toFixed(2)}in recently.`);
  
  const matchDesc = typeof match.desc === 'function' ? match.desc(conds) : match.desc;
  if (matchDesc) descParts.push(matchDesc);
  
  return {
    v: match.v,
    t: match.t,
    c: match.c,
    i: typeof match.i === 'function' ? match.i(conds) : match.i,
    desc: descParts.length > 0 ? descParts.join(' ') : 'No significant precipitation recently or expected soon.'
  };
};