import { PredictionResult } from '../utils/types';

interface Props {
  predictions: PredictionResult[];
}

export default function PredictionCard({ predictions }: Props) {
  if (predictions.length === 0) return null;

  const tomorrow = predictions[0];

  const formatDate = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const sourcesAgree = (p: PredictionResult) => {
    const sources: string[] = [];
    const threshold = 5;
    if (p.openMeteoHigh !== null && Math.abs(p.openMeteoHigh - p.predictedHigh) <= threshold) {
      sources.push('Open-Meteo');
    }
    if (p.nwsHigh !== null && Math.abs(p.nwsHigh - p.predictedHigh) <= threshold) {
      sources.push('NWS');
    }
    return sources;
  };

  const agreeing = sourcesAgree(tomorrow);

  return (
    <div className="prediction-card">
      <h2>Tomorrow's Prediction</h2>
      <p className="prediction-date">{formatDate(tomorrow.date)}</p>

      <div className="prediction-temps">
        <div className="temp-block high">
          <span className="label">High</span>
          <span className="value">{tomorrow.predictedHigh}°F</span>
        </div>
        <div className="temp-block low">
          <span className="label">Low</span>
          <span className="value">{tomorrow.predictedLow}°F</span>
        </div>
      </div>

      <div className="prediction-meta">
        <span className={`confidence-badge ${tomorrow.confidence}`}>
          {tomorrow.confidence.toUpperCase()} CONFIDENCE
        </span>
        {agreeing.length > 0 && (
          <p className="agreement">
            Agrees with: {agreeing.join(', ')}
          </p>
        )}
        {agreeing.length === 0 && (
          <p className="agreement warning">
            Diverges from both forecast sources
          </p>
        )}
      </div>

      <div className="kalshi-hint">
        <h3>Kalshi Market Insight</h3>
        <p>
          Predicted NYC high: <strong>{tomorrow.predictedHigh}°F</strong>
          {tomorrow.openMeteoHigh !== null && (
            <> | Open-Meteo: <strong>{tomorrow.openMeteoHigh}°F</strong></>
          )}
          {tomorrow.nwsHigh !== null && (
            <> | NWS: <strong>{tomorrow.nwsHigh}°F</strong></>
          )}
        </p>
      </div>
    </div>
  );
}
