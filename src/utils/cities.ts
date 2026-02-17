import { City } from './types';

export const CITIES: City[] = [
  { name: 'New York', lat: 40.7128, lon: -74.006, timezone: 'America/New_York' },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298, timezone: 'America/Chicago' },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, timezone: 'America/Los_Angeles' },
  { name: 'Miami', lat: 25.7617, lon: -80.1918, timezone: 'America/New_York' },
  { name: 'Dallas', lat: 32.7767, lon: -96.797, timezone: 'America/Chicago' },
  { name: 'Denver', lat: 39.7392, lon: -104.9903, timezone: 'America/Denver' },
  { name: 'Austin', lat: 30.2672, lon: -97.7431, timezone: 'America/Chicago' },
];

export const DEFAULT_CITY = CITIES[0];
