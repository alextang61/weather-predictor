import { useEffect, useState } from 'react';
import { fetchOpenMeteoData } from '../api/openMeteo';
import { fetchNWSForecast } from '../api/weatherGov';
import { generatePredictions, getPredictionLine } from '../utils/prediction';
import { DailyWeather, PredictionResult } from '../utils/types';
import TemperatureChart from './TemperatureChart';
import ForecastTable from './ForecastTable';
import PredictionCard from './PredictionCard';

export default function Dashboard() {
  const [historical, setHistorical] = useState<DailyWeather[]>([]);
  const [openMeteoForecast, setOpenMeteoForecast] = useState<DailyWeather[]>([]);
  const [nwsForecast, setNwsForecast] = useState<DailyWeather[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [predictionLine, setPredictionLine] = useState<DailyWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [openMeteoResult, nwsResult] = await Promise.allSettled([
          fetchOpenMeteoData(),
          fetchNWSForecast(),
        ]);

        let hist: DailyWeather[] = [];
        let omForecast: DailyWeather[] = [];
        let nws: DailyWeather[] = [];

        if (openMeteoResult.status === 'fulfilled') {
          hist = openMeteoResult.value.historical;
          omForecast = openMeteoResult.value.forecast;
          setHistorical(hist);
          setOpenMeteoForecast(omForecast);
        } else {
          console.error('Open-Meteo fetch failed:', openMeteoResult.reason);
        }

        if (nwsResult.status === 'fulfilled') {
          nws = nwsResult.value;
          setNwsForecast(nws);
        } else {
          console.error('NWS fetch failed:', nwsResult.reason);
        }

        if (hist.length > 0) {
          const preds = generatePredictions(hist, omForecast, nws, 3);
          setPredictions(preds);
          setPredictionLine(getPredictionLine(hist, 7));
        }

        if (openMeteoResult.status === 'rejected' && nwsResult.status === 'rejected') {
          setError('Failed to fetch weather data from all sources.');
        }
      } catch (err) {
        setError('An unexpected error occurred.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Fetching weather data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header>
        <h1>Weather Predictor</h1>
        <p className="subtitle">NYC Temperature Analysis for Kalshi Markets</p>
      </header>

      <PredictionCard predictions={predictions} />

      <TemperatureChart
        historical={historical}
        openMeteoForecast={openMeteoForecast}
        nwsForecast={nwsForecast}
        prediction={predictionLine}
      />

      <ForecastTable predictions={predictions} />
    </div>
  );
}
