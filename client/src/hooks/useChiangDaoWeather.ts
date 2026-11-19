import { useState, useEffect } from 'react';

export interface DailyForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  rainProb: number;
  weatherCode: number;
}

export interface ChiangDaoWeather {
  temp: number;
  humidity: number;
  weatherCode: number;
  mistChance: 'high' | 'medium' | 'low';
  daily: DailyForecast[];
  fetchedAt: number;
}

const CACHE_KEY = 'pakjai_cd_weather_v1';
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes

// Chiang Dao valley coordinates
const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=19.366&longitude=98.964&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&forecast_days=3&timezone=Asia%2FBangkok';

export const weatherCodeToKey = (code: number): string => {
  if (code === 0) return 'weather.condClear';
  if (code <= 3) return 'weather.condPartlyCloudy';
  if (code === 45 || code === 48) return 'weather.condMist';
  if (code >= 51 && code <= 67) return 'weather.condRain';
  if (code >= 80 && code <= 82) return 'weather.condShowers';
  if (code >= 95) return 'weather.condStorm';
  return 'weather.condPartlyCloudy';
};

const computeMistChance = (temp: number, humidity: number, code: number): 'high' | 'medium' | 'low' => {
  if (code === 45 || code === 48) return 'high';
  if (humidity >= 80 && temp <= 24) return 'high';
  if (humidity >= 68 || temp <= 21) return 'medium';
  return 'low';
};

export const useChiangDaoWeather = () => {
  const [weather, setWeather] = useState<ChiangDaoWeather | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ChiangDaoWeather;
      if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) return parsed;
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    if (weather && Date.now() - weather.fetchedAt < CACHE_TTL_MS) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(WEATHER_URL);
        if (!res.ok) return;
        const json = await res.json();
        const temp = Math.round(Number(json?.current?.temperature_2m ?? 20));
        const humidity = Math.round(Number(json?.current?.relative_humidity_2m ?? 72));
        const weatherCode = Number(json?.current?.weather_code ?? 1);

        const times: string[] = json?.daily?.time || [];
        const mins: number[] = json?.daily?.temperature_2m_min || [];
        const maxs: number[] = json?.daily?.temperature_2m_max || [];
        const rains: number[] = json?.daily?.precipitation_probability_max || [];
        const codes: number[] = json?.daily?.weather_code || [];

        const daily: DailyForecast[] = times.slice(0, 3).map((date, idx) => ({
          date,
          tempMin: Math.round(Number(mins[idx] ?? 15)),
          tempMax: Math.round(Number(maxs[idx] ?? 26)),
          rainProb: Math.round(Number(rains[idx] ?? 10)),
          weatherCode: Number(codes[idx] ?? 1),
        }));

        const data: ChiangDaoWeather = {
          temp,
          humidity,
          weatherCode,
          mistChance: computeMistChance(temp, humidity, weatherCode),
          daily,
          fetchedAt: Date.now(),
        };

        if (!cancelled) {
          setWeather(data);
          try {
            window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
          } catch {
            // ignore
          }
        }
      } catch {
        // Offline or blocked — keep graceful fallback
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [weather]);

  return weather;
};
