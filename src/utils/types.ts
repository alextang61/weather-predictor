export interface DailyWeather {
  date: string; // YYYY-MM-DD
  high: number; // °F
  low: number;  // °F
}

export interface WeatherData {
  historical: DailyWeather[];   // past 14 days actuals from Open-Meteo
  openMeteoForecast: DailyWeather[];  // 7-day forecast from Open-Meteo
  nwsForecast: DailyWeather[];        // 7-day forecast from Weather.gov
  prediction: DailyWeather[];          // our linear regression prediction
}

export interface PredictionResult {
  date: string;
  predictedHigh: number;
  predictedLow: number;
  openMeteoHigh: number | null;
  openMeteoLow: number | null;
  nwsHigh: number | null;
  nwsLow: number | null;
  confidence: 'high' | 'medium' | 'low';
}
