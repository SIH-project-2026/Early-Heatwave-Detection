export interface LiveWeatherData {
  temperatureC: number;
  apparentTempC: number; // UTCI equivalent
  humidity: number;
  windSpeed: number;
  wbgtIndex: number;
  hviScore: number;
  riskLevel: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW';
  source?: string;
  hourlyForecast?: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    relative_humidity_2m: number[];
  };
}

// Outdoor WBGT approximation formula (ISO 7243 / BOM Standard)
export function calculateWbgt(tempC: number, humidityPct: number): number {
  const e = (humidityPct / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  const wbgt = 0.567 * tempC + 0.393 * e + 3.94;
  return parseFloat(wbgt.toFixed(1));
}

// Municipal HVI Risk calculation from live apparent heat stress
export function calculateHviFromTemp(apparentTemp: number): number {
  if (apparentTemp >= 45) return 0.88;
  if (apparentTemp >= 40) return 0.72;
  if (apparentTemp >= 35) return 0.52;
  return 0.32;
}

const WEATHER_API_KEY =
  import.meta.env.VITE_WEATHER_API_KEY ||
  import.meta.env.WEATHER_API_KEY ||
  'd9ec6ffce4910db44599bd7b37bea410';

export async function fetchLiveWeatherForCoords(lat: number, lng: number): Promise<LiveWeatherData> {
  // 1. Try OpenWeatherMap API with provided key
  if (WEATHER_API_KEY) {
    try {
      const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${WEATHER_API_KEY}`;
      const res = await fetch(owmUrl);
      if (res.ok) {
        const data = await res.json();
        const tempC = Number(data.main?.temp?.toFixed(1) || 42.5);
        const apparentTempC = Number(data.main?.feels_like?.toFixed(1) || tempC + 4);
        const humidity = Number(data.main?.humidity || 65);
        const windSpeed = Number(data.wind?.speed ? (data.wind.speed * 3.6).toFixed(1) : 12.4);

        const wbgtIndex = calculateWbgt(tempC, humidity);
        const hviScore = calculateHviFromTemp(apparentTempC);

        let riskLevel: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
        if (hviScore >= 0.75 || apparentTempC >= 45) riskLevel = 'SEVERE';
        else if (hviScore >= 0.60 || apparentTempC >= 40) riskLevel = 'HIGH';
        else if (hviScore >= 0.40 || apparentTempC >= 35) riskLevel = 'MODERATE';

        return {
          temperatureC: tempC,
          apparentTempC,
          humidity,
          windSpeed,
          wbgtIndex,
          hviScore,
          riskLevel,
          source: 'OpenWeatherMap API',
        };
      }
    } catch (owmErr) {
      console.warn('OpenWeatherMap API note, trying Open-Meteo:', owmErr);
    }
  }

  // 2. Open-Meteo Satellite API
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&hourly=temperature_2m,relative_humidity_2m,apparent_temperature&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Live Weather API HTTP error');
    const data = await res.json();

    const current = data.current || {};
    const tempC = typeof current.temperature_2m === 'number' ? current.temperature_2m : 42.5;
    const apparentTempC = typeof current.apparent_temperature === 'number' ? current.apparent_temperature : 46.2;
    const humidity = typeof current.relative_humidity_2m === 'number' ? current.relative_humidity_2m : 65;
    const windSpeed = typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : 12.4;

    const wbgtIndex = calculateWbgt(tempC, humidity);
    const hviScore = calculateHviFromTemp(apparentTempC);

    let riskLevel: 'SEVERE' | 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    if (hviScore >= 0.75 || apparentTempC >= 45) riskLevel = 'SEVERE';
    else if (hviScore >= 0.60 || apparentTempC >= 40) riskLevel = 'HIGH';
    else if (hviScore >= 0.40 || apparentTempC >= 35) riskLevel = 'MODERATE';

    return {
      temperatureC: tempC,
      apparentTempC,
      humidity,
      windSpeed,
      wbgtIndex,
      hviScore,
      riskLevel,
      source: 'Open-Meteo Satellite API',
      hourlyForecast: data.hourly,
    };
  } catch (err) {
    console.warn('Falling back to simulated thermal telemetry:', err);
    return {
      temperatureC: 42.8,
      apparentTempC: 47.1,
      humidity: 68,
      windSpeed: 14.2,
      wbgtIndex: 32.2,
      hviScore: 0.85,
      riskLevel: 'SEVERE',
      source: 'Telemetry Simulation',
    };
  }
}
