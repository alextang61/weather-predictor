import axios from 'axios';
import { DailyWeather } from '../utils/types';

interface PointsResponse {
  properties: {
    forecast: string;
  };
}

interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  temperature: number;
  isDaytime: boolean;
}

interface ForecastResponse {
  properties: {
    periods: ForecastPeriod[];
  };
}

export async function fetchNWSForecast(lat: number, lon: number): Promise<DailyWeather[]> {
  const headers = { 'User-Agent': 'WeatherPredictor/1.0' };

  // Step 1: Get forecast URL from points endpoint
  const pointsUrl = `https://api.weather.gov/points/${lat},${lon}`;
  const pointsResponse = await axios.get<PointsResponse>(pointsUrl, { headers });
  const forecastUrl = pointsResponse.data.properties.forecast;

  // Step 2: Fetch the forecast
  const forecastResponse = await axios.get<ForecastResponse>(forecastUrl, { headers });
  const periods = forecastResponse.data.properties.periods;

  // Group periods into days (day/night pairs)
  const dayMap = new Map<string, { high?: number; low?: number }>();

  for (const period of periods) {
    const date = period.startTime.split('T')[0];
    if (!dayMap.has(date)) {
      dayMap.set(date, {});
    }
    const day = dayMap.get(date)!;
    if (period.isDaytime) {
      day.high = period.temperature;
    } else {
      day.low = period.temperature;
    }
  }

  const forecast: DailyWeather[] = [];
  for (const [date, temps] of dayMap) {
    if (temps.high !== undefined && temps.low !== undefined) {
      forecast.push({ date, high: temps.high, low: temps.low });
    }
  }

  return forecast;
}
