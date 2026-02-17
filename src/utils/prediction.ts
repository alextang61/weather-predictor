import { DailyWeather, PredictionResult } from './types';

function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  const xs = values.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumXX = xs.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function predictValues(historical: number[], daysAhead: number): number[] {
  const reg = linearRegression(historical);
  const n = historical.length;
  const predictions: number[] = [];

  for (let i = 0; i < daysAhead; i++) {
    predictions.push(Math.round(reg.intercept + reg.slope * (n + i)));
  }

  return predictions;
}

export function generatePredictions(
  historical: DailyWeather[],
  openMeteoForecast: DailyWeather[],
  nwsForecast: DailyWeather[],
  daysAhead = 3
): PredictionResult[] {
  if (historical.length < 3) return [];

  const highs = historical.map(d => d.high);
  const lows = historical.map(d => d.low);

  const predictedHighs = predictValues(highs, daysAhead);
  const predictedLows = predictValues(lows, daysAhead);

  const results: PredictionResult[] = [];
  const lastDate = new Date(historical[historical.length - 1].date);

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i + 1);
    const dateStr = date.toISOString().split('T')[0];

    const omDay = openMeteoForecast.find(d => d.date === dateStr);
    const nwsDay = nwsForecast.find(d => d.date === dateStr);

    const predHigh = predictedHighs[i];
    const predLow = predictedLows[i];

    // Confidence based on agreement between sources
    let agreementCount = 0;
    const threshold = 5; // °F
    if (omDay && Math.abs(omDay.high - predHigh) <= threshold) agreementCount++;
    if (nwsDay && Math.abs(nwsDay.high - predHigh) <= threshold) agreementCount++;

    let confidence: 'high' | 'medium' | 'low';
    if (agreementCount === 2) confidence = 'high';
    else if (agreementCount === 1) confidence = 'medium';
    else confidence = 'low';

    results.push({
      date: dateStr,
      predictedHigh: predHigh,
      predictedLow: predLow,
      openMeteoHigh: omDay?.high ?? null,
      openMeteoLow: omDay?.low ?? null,
      nwsHigh: nwsDay?.high ?? null,
      nwsLow: nwsDay?.low ?? null,
      confidence,
    });
  }

  return results;
}

export function getPredictionLine(
  historical: DailyWeather[],
  daysAhead = 7
): DailyWeather[] {
  if (historical.length < 3) return [];

  const highs = historical.map(d => d.high);
  const lows = historical.map(d => d.low);

  const predictedHighs = predictValues(highs, daysAhead);
  const predictedLows = predictValues(lows, daysAhead);

  const lastDate = new Date(historical[historical.length - 1].date);

  return predictedHighs.map((high, i) => {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i + 1);
    return {
      date: date.toISOString().split('T')[0],
      high,
      low: predictedLows[i],
    };
  });
}
