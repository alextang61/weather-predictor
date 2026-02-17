import axios from 'axios';
import { DailyWeather } from '../utils/types';

const celsiusToFahrenheit = (c: number) => Math.round(c * 9 / 5 + 32);

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

export async function fetchOpenMeteoData(lat: number, lon: number, timezone: string): Promise<{
  historical: DailyWeather[];
  forecast: DailyWeather[];
}> {
  const url = 'https://api.open-meteo.com/v1/forecast';
  const params = {
    latitude: lat,
    longitude: lon,
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone,
    past_days: 14,
    forecast_days: 7,
    temperature_unit: 'fahrenheit',
  };

  const response = await axios.get<OpenMeteoResponse>(url, { params });
  const { time, temperature_2m_max, temperature_2m_min } = response.data.daily;

  const today = new Date().toISOString().split('T')[0];
  const all: DailyWeather[] = time.map((date, i) => ({
    date,
    high: Math.round(temperature_2m_max[i]),
    low: Math.round(temperature_2m_min[i]),
  }));

  const historical = all.filter(d => d.date <= today);
  const forecast = all.filter(d => d.date > today);

  return { historical, forecast };
}
