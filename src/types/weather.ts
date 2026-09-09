export interface LiveWeatherData {
  temperature: number | null; // in °C
  precipitation: number; // in mm
  precipitationProbability: number; // in %
  windSpeed: number; // in km/h
  relativeHumidity: number | null; // in %
  visibility: number | null; // in meters
  weatherCode: number; // WMO code
  weatherDescription: string;
  icon: string;
  condition: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  stationCode?: string | null;
  source: 'Open-Meteo API';
  lastUpdatedAt: string;
}

export interface WeatherRiskAssessment {
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskLabel: string;
  predictedDelayImpactMinutes: number;
  riskFactors: string[];
  recommendations: string[];
  attributionFactor: number;
  disclaimer: string;
}

export interface WeatherApiResponse {
  success: boolean;
  data?: LiveWeatherData;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    source: string;
    cached: boolean;
    timestamp: string;
  };
}
