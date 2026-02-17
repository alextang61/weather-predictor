import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { DailyWeather } from '../utils/types';

interface Props {
  historical: DailyWeather[];
  openMeteoForecast: DailyWeather[];
  nwsForecast: DailyWeather[];
  prediction: DailyWeather[];
}

interface ChartDataPoint {
  date: string;
  actualHigh?: number;
  actualLow?: number;
  omHigh?: number;
  omLow?: number;
  nwsHigh?: number;
  nwsLow?: number;
  predHigh?: number;
  predLow?: number;
}

export default function TemperatureChart({ historical, openMeteoForecast, nwsForecast, prediction }: Props) {
  // Merge all data into chart-friendly format
  const dateMap = new Map<string, ChartDataPoint>();

  const getOrCreate = (date: string) => {
    if (!dateMap.has(date)) dateMap.set(date, { date });
    return dateMap.get(date)!;
  };

  for (const d of historical) {
    const p = getOrCreate(d.date);
    p.actualHigh = d.high;
    p.actualLow = d.low;
  }
  for (const d of openMeteoForecast) {
    const p = getOrCreate(d.date);
    p.omHigh = d.high;
    p.omLow = d.low;
  }
  for (const d of nwsForecast) {
    const p = getOrCreate(d.date);
    p.nwsHigh = d.high;
    p.nwsLow = d.low;
  }
  for (const d of prediction) {
    const p = getOrCreate(d.date);
    p.predHigh = d.high;
    p.predLow = d.low;
  }

  const data = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date().toISOString().split('T')[0];

  const formatDate = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chart-container">
      <h2>Temperature Trends — NYC</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" tickFormatter={formatDate} stroke="#999" fontSize={12} />
          <YAxis stroke="#999" fontSize={12} unit="°F" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }}
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value) => [`${value}°F`]}
          />
          <Legend />
          <ReferenceLine x={today} stroke="#666" strokeDasharray="5 5" label={{ value: 'Today', fill: '#999', fontSize: 12 }} />

          {/* Actual temps */}
          <Line type="monotone" dataKey="actualHigh" stroke="#ff6b6b" strokeWidth={2} name="Actual High" dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="actualLow" stroke="#4ecdc4" strokeWidth={2} name="Actual Low" dot={{ r: 3 }} connectNulls />

          {/* Open-Meteo forecast */}
          <Line type="monotone" dataKey="omHigh" stroke="#ff9f43" strokeWidth={2} strokeDasharray="5 5" name="Open-Meteo High" dot={{ r: 2 }} connectNulls />
          <Line type="monotone" dataKey="omLow" stroke="#48dbfb" strokeWidth={2} strokeDasharray="5 5" name="Open-Meteo Low" dot={{ r: 2 }} connectNulls />

          {/* NWS forecast */}
          <Line type="monotone" dataKey="nwsHigh" stroke="#feca57" strokeWidth={2} strokeDasharray="3 3" name="NWS High" dot={{ r: 2 }} connectNulls />
          <Line type="monotone" dataKey="nwsLow" stroke="#54a0ff" strokeWidth={2} strokeDasharray="3 3" name="NWS Low" dot={{ r: 2 }} connectNulls />

          {/* Prediction */}
          <Line type="monotone" dataKey="predHigh" stroke="#ff6348" strokeWidth={2} strokeDasharray="8 4" name="Predicted High" dot={{ r: 3, fill: '#ff6348' }} connectNulls />
          <Line type="monotone" dataKey="predLow" stroke="#7bed9f" strokeWidth={2} strokeDasharray="8 4" name="Predicted Low" dot={{ r: 3, fill: '#7bed9f' }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
