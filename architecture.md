# Weather Predictor — Architecture

## Overview

Weather Predictor is a React dashboard that pulls temperature data from two free weather APIs, runs a linear regression trend analysis on recent historical data, and presents predicted high/low temperatures for selectable US cities. It's designed to inform decisions on Kalshi temperature betting markets.

## Data Sources

### Open-Meteo (`src/api/openMeteo.ts`)

- **No API key required**
- Single endpoint returns both historical actuals and forecast in one call
- URL: `https://api.open-meteo.com/v1/forecast`
- Accepts `lat`, `lon`, and `timezone` parameters from the selected city
- Additional parameters: `past_days=14`, `forecast_days=7`, `temperature_unit=fahrenheit`
- Provides: daily `temperature_2m_max` and `temperature_2m_min`
- Data is split into two arrays at fetch time:
  - **Historical** (dates <= today) — used as ground truth for trend analysis
  - **Forecast** (dates > today) — used as one of two forecast comparison sources

### Weather.gov / NWS (`src/api/weatherGov.ts`)

- **No API key required** (requires `User-Agent` header)
- Accepts `lat` and `lon` parameters from the selected city
- Two-step fetch:
  1. **Points endpoint** (`/points/{lat},{lon}`) — resolves lat/lon to the local forecast office and grid coordinates
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

- `generatePredictions()` — returns `PredictionResult[]` for the next 10 days with predicted values, API forecast values, and confidence level
- `getPredictionLine()` — returns `DailyWeather[]` for the next 10 days, used to draw the trend line on the chart

## Component Architecture

```
App.tsx
  └── Dashboard.tsx          — city state, data fetching & state management
        ├── CitySelector     — pill-button group for switching cities
        ├── PredictionCard   — headline: tomorrow's predicted high/low + confidence
        ├── TemperatureChart — Recharts line chart (all data series)
        └── ForecastTable    — tabular side-by-side comparison
```

### Dashboard (`src/components/Dashboard.tsx`)

- Holds `selectedCity` state (defaults to New York via `DEFAULT_CITY`)
- Fetches both APIs in parallel using `Promise.allSettled`, passing the selected city's coordinates and timezone (graceful degradation if one source fails)
- Re-fetches all data when the selected city changes (`selectedCity` in `useEffect` deps)
- Runs prediction analysis once data arrives
- Passes city name down to child components for display

### CitySelector (`src/components/CitySelector.tsx`)

- Renders a row of pill-shaped buttons, one per city from the `CITIES` array
- Highlights the active city with a distinct style
- Calls `onCityChange` callback when a different city is clicked

### TemperatureChart (`src/components/TemperatureChart.tsx`)

- Accepts a `cityName` prop, used in the chart title
- Displays a fixed 14-day window centered on today (7 days back, 6 days forward + today)
- Merges all data series into a single date-keyed array for Recharts
- Plots 8 lines: actual high/low, Open-Meteo high/low, NWS high/low, predicted high/low
- Each source has a distinct color and dash pattern for visual clarity
- Vertical reference line marks "today" to separate actuals from forecasts
- Custom tooltip shows data source label (Actual, Open-Meteo Forecast, NWS Forecast, Prediction) next to each value

### ForecastTable (`src/components/ForecastTable.tsx`)

- Displays the next 10 days in a table with columns for each source's high/low
- Shows confidence badge per row
- Prediction values are bold to stand out

### PredictionCard (`src/components/PredictionCard.tsx`)

- Accepts a `cityName` prop, used in the Kalshi insight section
- Shows tomorrow's predicted high/low prominently
- Displays confidence badge and lists which sources agree
- Includes a "Kalshi Market Insight" section with all three values side by side

## Data Flow

```
City selection (user clicks CitySelector)
  │
  ▼
useEffect [selectedCity]
  │
  ├──► Open-Meteo API (lat, lon, tz) ──► { historical[], forecast[] }
  │                                              │
  ├──► Weather.gov API (lat, lon) ──► nwsForecast[]
  │                                              │
  └──────────────────────────────────────────────┼──► prediction.ts
                                                 │      ├── linearRegression(historical.highs)
                                                 │      ├── linearRegression(historical.lows)
                                                 │      ├── extrapolate forward
                                                 │      └── score confidence vs forecasts
                                                 │
                                                 ▼
                                          Dashboard state
                                           ├── PredictionCard(predictions, cityName)
                                           ├── TemperatureChart(...data, cityName)
                                           └── ForecastTable(predictions)
```

## City Configuration (`src/utils/cities.ts`)

Defines an array of `City` objects for cities with active Kalshi temperature markets:

| City        | Timezone             |
| ----------- | -------------------- |
| New York    | America/New_York     |
| Chicago     | America/Chicago      |
| Los Angeles | America/Los_Angeles  |
| Miami       | America/New_York     |
| Dallas      | America/Chicago      |
| Denver      | America/Denver       |
| Austin      | America/Chicago      |

`DEFAULT_CITY` is exported and set to New York. Adding a new city requires only appending to the `CITIES` array — no other code changes needed.

## Type System (`src/utils/types.ts`)

- **`City`** — `{ name: string, lat: number, lon: number, timezone: string }` — used to parameterize API calls and display labels
- **`DailyWeather`** — `{ date: string, high: number, low: number }` — universal format for all temperature data (°F)
- **`PredictionResult`** — extends a prediction day with values from all three sources plus a confidence rating
- **`WeatherData`** — aggregates all data arrays (used conceptually, components receive individual arrays as props)
