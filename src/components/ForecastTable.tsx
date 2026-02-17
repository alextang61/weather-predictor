import { PredictionResult } from '../utils/types';

interface Props {
  predictions: PredictionResult[];
}

export default function ForecastTable({ predictions }: Props) {
  const formatDate = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="forecast-table">
      <h2>Forecast Comparison</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th colSpan={2}>Open-Meteo</th>
            <th colSpan={2}>NWS</th>
            <th colSpan={2}>Prediction</th>
            <th>Confidence</th>
          </tr>
          <tr className="sub-header">
            <th></th>
            <th>High</th>
            <th>Low</th>
            <th>High</th>
            <th>Low</th>
            <th>High</th>
            <th>Low</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {predictions.map(p => (
            <tr key={p.date}>
              <td>{formatDate(p.date)}</td>
              <td className="temp-high">{p.openMeteoHigh !== null ? `${p.openMeteoHigh}°` : '—'}</td>
              <td className="temp-low">{p.openMeteoLow !== null ? `${p.openMeteoLow}°` : '—'}</td>
              <td className="temp-high">{p.nwsHigh !== null ? `${p.nwsHigh}°` : '—'}</td>
              <td className="temp-low">{p.nwsLow !== null ? `${p.nwsLow}°` : '—'}</td>
              <td className="temp-high predicted">{p.predictedHigh}°</td>
              <td className="temp-low predicted">{p.predictedLow}°</td>
              <td>
                <span className={`confidence ${p.confidence}`}>
                  {p.confidence.toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
