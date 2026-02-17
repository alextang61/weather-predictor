# Weather Predictor — Architecture

## Overview

Weather Predictor is a React dashboard that pulls temperature data from two free weather APIs, runs a linear regression trend analysis on recent historical data, and presents predicted high/low temperatures for New York City. It's designed to inform decisions on Kalshi temperature betting markets.

## Data Sources

### Open-Meteo (`src/api/openMeteo.ts`)

- **No API key required**
- Single endpoint returns both historical actuals and forecast in one call
- URL: `https://api.open-meteo.com/v1/forecast`
- Parameters: `past_days=14`, `forecast_days=7`, `temperature_unit=fahrenheit`
- Provides: daily `temperature_2m_max` and `temperature_2m_min`
- Data is split into two arrays at fetch time:
  - **Historical** (dates <= today) — used as ground truth for trend analysis
  - **Forecast** (dates > today) — used as one of two forecast comparison sources

### Weather.gov / NWS (`src/api/weatherGov.ts`)

- **No API key required** (requires `User-Agent` header)
- Two-step fetch:
  1. **Points endpoint** (`/points/40.7128,-74.006`) — resolves lat/lon to the local forecast office and grid coordinates
  2. **Gridpoint forecast** (`/gridpoints/{office}/{gridX},{gridY}/forecast`) — returns 7-day forecast as day/night period pairs
- Periods are grouped by date and paired (daytime → high, nighttime → low) into `DailyWeather` records
- Only days with both a high and low value are included

### Why Two Sources?

Open-Meteo uses ECMWF/GFS model data. Weather.gov uses NWS operational forecasts. Comparing independent models reveals consensus (high confidence) or divergence (low confidence) — critical context for betting decisions.

## Analysis & Prediction (`src/utils/prediction.ts`)

### Method: Ordinary Least Squares Linear Regression

The prediction engine fits a simple linear trend line to the last 14 days of actual observed temperatures (from Open-Meteo historical data).

**How it works:**

1. Take the 14 most recent actual high temperatures as `y` values, with day index (0–13) as `x` values
2. Compute slope and intercept via the standard OLS formula:
   - `slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)`
   - `intercept = (sumY - slope * sumX) / n`
3. Extrapolate forward by plugging in `x = 14, 15, 16, ...` to get predicted values
4. Repeat independently for low temperatures

### Confidence Scoring

Each predicted day is scored against both API forecasts:

| Agreement                          | Confidence |
| ---------------------------------- | ---------- |
| Both forecasts within 5°F of prediction | HIGH       |
| One forecast within 5°F               | MEDIUM     |
| Neither within 5°F                    | LOW        |

### Output

- `generatePredictions()` — returns `PredictionResult[]` for the next 3 days with predicted values, API forecast values, and confidence level
- `getPredictionLine()` — returns `DailyWeather[]` for the next 7 days, used to draw the trend line on the chart

## Component Architecture

```
App.tsx
  └── Dashboard.tsx          — data fetching & state management
        ├── PredictionCard    — headline: tomorrow's predicted high/low + confidence
        ├── TemperatureChart  — Recharts line chart (all data series)
        └── ForecastTable     — tabular side-by-side comparison
```

### Dashboard (`src/components/Dashboard.tsx`)

- Fetches both APIs in parallel on mount using `Promise.allSettled` (graceful degradation if one source fails)
- Runs prediction analysis once data arrives
- Manages all state and passes data down as props

### TemperatureChart (`src/components/TemperatureChart.tsx`)

- Merges all data series into a single date-keyed array for Recharts
- Plots 8 lines: actual high/low, Open-Meteo high/low, NWS high/low, predicted high/low
- Each source has a distinct color and dash pattern for visual clarity
- Vertical reference line marks "today" to separate actuals from forecasts

### ForecastTable (`src/components/ForecastTable.tsx`)

- Displays the next 3 days in a table with columns for each source's high/low
- Shows confidence badge per row
- Prediction values are bold to stand out

### PredictionCard (`src/components/PredictionCard.tsx`)

- Shows tomorrow's predicted high/low prominently
- Displays confidence badge and lists which sources agree
- Includes a "Kalshi Market Insight" section with all three values side by side

## Data Flow

```
Mount
  │
  ├──► Open-Meteo API ──► { historical[], forecast[] }
  │                              │
  ├──► Weather.gov API ──► nwsForecast[]
  │                              │
  └──────────────────────────────┼──► prediction.ts
                                 │      ├── linearRegression(historical.highs)
                                 │      ├── linearRegression(historical.lows)
                                 │      ├── extrapolate forward
                                 │      └── score confidence vs forecasts
                                 │
                                 ▼
                          Dashboard state
                           ├── PredictionCard(predictions)
                           ├── TemperatureChart(historical, omForecast, nwsForecast, predictionLine)
                           └── ForecastTable(predictions)
```

## Type System (`src/utils/types.ts`)

- **`DailyWeather`** — `{ date: string, high: number, low: number }` — universal format for all temperature data (°F)
- **`PredictionResult`** — extends a prediction day with values from all three sources plus a confidence rating
- **`WeatherData`** — aggregates all data arrays (used conceptually, components receive individual arrays as props)
