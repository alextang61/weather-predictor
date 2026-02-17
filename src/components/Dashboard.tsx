import { useEffect, useState } from 'react';
import { fetchOpenMeteoData } from '../api/openMeteo';
import { fetchNWSForecast } from '../api/weatherGov';
import { generatePredictions, getPredictionLine } from '../utils/prediction';
import { City, DailyWeather, PredictionResult } from '../utils/types';
import { DEFAULT_CITY } from '../utils/cities';
import TemperatureChart from './TemperatureChart';
import ForecastTable from './ForecastTable';
import PredictionCard from './PredictionCard';
import CitySelector from './CitySelector';

export default function Dashboard() {
  const [selectedCity, setSelectedCity] = useState<City>(DEFAULT_CITY);
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
          fetchOpenMeteoData(selectedCity.lat, selectedCity.lon, selectedCity.timezone),
          fetchNWSForecast(selectedCity.lat, selectedCity.lon),
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
  }, [selectedCity]);

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
        <p className="subtitle">{selectedCity.name} Temperature Analysis for Kalshi Markets</p>
        <CitySelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
      </header>

      <PredictionCard predictions={predictions} cityName={selectedCity.name} />

      <TemperatureChart
        historical={historical}
        openMeteoForecast={openMeteoForecast}
        nwsForecast={nwsForecast}
        prediction={predictionLine}
        cityName={selectedCity.name}
      />

      <ForecastTable predictions={predictions} />
    </div>
  );
}
