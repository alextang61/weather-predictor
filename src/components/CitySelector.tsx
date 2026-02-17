import { City } from '../utils/types';
import { CITIES } from '../utils/cities';

interface Props {
  selectedCity: City;
  onCityChange: (city: City) => void;
}

export default function CitySelector({ selectedCity, onCityChange }: Props) {
  return (
    <div className="city-selector">
      {CITIES.map((city) => (
        <button
          key={city.name}
          className={`city-btn ${city.name === selectedCity.name ? 'active' : ''}`}
          onClick={() => onCityChange(city)}
        >
          {city.name}
        </button>
      ))}
    </div>
  );
}
