import type {
  LiveWeatherData,
  WeatherRiskAssessment,
  WeatherApiResponse,
} from '../types/weather';
import type { RailRadarLiveData } from '../types/railradar';

// Exact coordinates for major Indian Railways junction stations
export const KNOWN_STATION_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  NDLS: { lat: 28.6429, lng: 77.2195, name: 'New Delhi' },
  BZA: { lat: 16.518, lng: 80.6196, name: 'Vijayawada Jn' },
  KMT: { lat: 17.2473, lng: 80.1514, name: 'Khammam' },
  WL: { lat: 17.9689, lng: 79.5941, name: 'Warangal' },
  KZJ: { lat: 17.9042, lng: 79.5244, name: 'Kazipet Jn' },
  SC: { lat: 17.4339, lng: 78.5042, name: 'Secunderabad Jn' },
  HYB: { lat: 17.3934, lng: 78.4721, name: 'Hyderabad Deccan' },
  MAS: { lat: 13.0827, lng: 80.2707, name: 'Chennai Central' },
  HWH: { lat: 22.5839, lng: 88.3426, name: 'Howrah Jn' },
  SBC: { lat: 12.9781, lng: 77.5696, name: 'KSR Bengaluru' },
  MMCT: { lat: 18.9696, lng: 72.8193, name: 'Mumbai Central' },
  CSMT: { lat: 18.9402, lng: 72.8356, name: 'Chhatrapati Shivaji Maharaj Terminus' },
  TVC: { lat: 8.4867, lng: 76.9517, name: 'Thiruvananthapuram Central' },
  CNB: { lat: 26.4547, lng: 80.3507, name: 'Kanpur Central' },
  PRYJ: { lat: 25.4437, lng: 81.8285, name: 'Prayagraj Jn' },
  DDU: { lat: 25.2798, lng: 83.1235, name: 'Pt. Deen Dayal Upadhyaya Jn' },
  ST: { lat: 21.2049, lng: 72.8406, name: 'Surat' },
  BRC: { lat: 22.3106, lng: 73.1812, name: 'Vadodara Jn' },
  RTM: { lat: 23.3364, lng: 75.0371, name: 'Ratlam Jn' },
  GHY: { lat: 26.1818, lng: 91.7533, name: 'Guwahati' },
  PUNE: { lat: 18.5284, lng: 73.8744, name: 'Pune Jn' },
  NGP: { lat: 21.1528, lng: 79.0882, name: 'Nagpur Jn' },
  BSB: { lat: 25.3283, lng: 82.9866, name: 'Varanasi Jn' },
  ADI: { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad Jn' },
  AGC: { lat: 27.1574, lng: 77.9918, name: 'Agra Cantt' },
  GWL: { lat: 26.2166, lng: 78.1884, name: 'Gwalior Jn' },
  VGLJ: { lat: 25.4484, lng: 78.5685, name: 'Virangana Lakshmibai Jhansi' },
  BPL: { lat: 23.2662, lng: 77.4143, name: 'Bhopal Jn' },
  ET: { lat: 22.6105, lng: 77.7602, name: 'Itarsi Jn' },
  BPQ: { lat: 19.8703, lng: 79.3514, name: 'Balharshah' },
};

/**
 * Extracts real railway coordinates from the selected train's current station / route location.
 * Requirement 5: Weather coordinates MUST come from the actual station/route data belonging to that selected train.
 * Requirement 6: If RailRadar does not provide coordinates for a route station:
 * - resolve that station using the existing station data/lookup mechanism if available
 * - otherwise show "Weather unavailable"
 * - DO NOT substitute another station.
 */
export function extractCoordinatesFromTrain(
  train: RailRadarLiveData | null
): { lat: number; lng: number; stationCode?: string; stationName?: string } | null {
  if (!train) return null;

  const currentStationCode = train.currentLocation?.stationCode;
  const currentStationName = train.currentLocation?.stationName;

  // 1. Check live currentLocation coordinates directly from RailRadar
  const locCoords = (train.currentLocation as any)?.coordinates;
  if (
    locCoords &&
    typeof locCoords.lat === 'number' &&
    typeof locCoords.lng === 'number' &&
    !isNaN(locCoords.lat) &&
    !isNaN(locCoords.lng) &&
    locCoords.lat !== 0 &&
    locCoords.lng !== 0
  ) {
    return {
      lat: locCoords.lat,
      lng: locCoords.lng,
      stationCode: currentStationCode,
      stationName: currentStationName,
    };
  }

  // 2. Check the matching station in this train's route list with lat/lng
  if (train.route && Array.isArray(train.route) && train.route.length > 0) {
    if (currentStationCode || currentStationName) {
      const match = train.route.find(
        (s) =>
          (currentStationCode && s.stationCode === currentStationCode) ||
          (currentStationName && s.stationName?.toLowerCase() === currentStationName.toLowerCase())
      );
      if (
        match &&
        typeof match.lat === 'number' &&
        typeof match.lng === 'number' &&
        !isNaN(match.lat) &&
        !isNaN(match.lng) &&
        match.lat !== 0
      ) {
        return {
          lat: match.lat,
          lng: match.lng,
          stationCode: match.stationCode || currentStationCode,
          stationName: match.stationName || currentStationName,
        };
      }
    }
  }

  // 3. Resolve that specific station using known Indian Railways junction coordinates lookup
  if (currentStationCode && KNOWN_STATION_COORDINATES[currentStationCode]) {
    const known = KNOWN_STATION_COORDINATES[currentStationCode];
    return {
      lat: known.lat,
      lng: known.lng,
      stationCode: currentStationCode,
      stationName: currentStationName || known.name,
    };
  }

  // Station coordinates not resolvable: DO NOT substitute another station. Return null.
  return null;
}

/**
 * Centralized Weather Service to request live weather from backend Open-Meteo proxy.
 */
export async function fetchLiveWeather(
  lat: number,
  lng: number,
  stationCode?: string
): Promise<LiveWeatherData> {
  const params = new URLSearchParams();
  params.set('lat', lat.toString());
  params.set('lng', lng.toString());
  if (stationCode) {
    params.set('stationCode', stationCode);
  }

  const res = await fetch(`/api/weather?${params.toString()}`);
  const json: WeatherApiResponse = await res.json();

  if (!res.ok || !json.success || !json.data) {
    throw new Error(
      json.error?.message || `Failed to fetch live weather (${res.status})`
    );
  }

  return json.data;
}

/**
 * RailPredict-derived Operational Delay Impact Assessment.
 * Clearly separates raw atmospheric observation from railway operational impact.
 * Open-Meteo provides the live weather; RailPredict derives the operational risk.
 */
export function deriveWeatherRisk(
  weather: LiveWeatherData,
  journeyState?: string
): WeatherRiskAssessment {
  if (journeyState === 'NOT_STARTED') {
    return {
      riskLevel: 'LOW',
      riskLabel: 'Nominal / Pre-Departure',
      predictedDelayImpactMinutes: 0,
      riskFactors: ['Scheduled departure pending; no atmospheric speed restrictions active.'],
      recommendations: ['Monitor track visibility approaching scheduled departure.'],
      attributionFactor: 0,
      disclaimer:
        'Live weather observations provided by Open-Meteo. Operational delay impact is independently derived by RailPredict and does not represent an Open-Meteo prediction.',
    };
  }

  const factors: string[] = [];
  const recommendations: string[] = [];
  let delayImpact = 0;

  // 1. Visibility Evaluation (Fog Safety Devices & Speed Caps)
  if (weather.visibility !== null) {
    if (weather.visibility < 500) {
      // Severe fog: Indian Railways rules mandate 30–60 km/h speed limit
      delayImpact += 6;
      factors.push(`Severe Fog / Dense Visibility (${weather.visibility}m): Indian Railways 60 km/h fog safety cap active.`);
      recommendations.push('Deploy Fog Safety Device (FSD) audio alerts on loco approach signals.');
    } else if (weather.visibility < 1500) {
      delayImpact += 3;
      factors.push(`Mist / Reduced Visibility (${weather.visibility}m): Signal aspect sighting distance restricted.`);
      recommendations.push('Maintain cautious braking curves approaching outer home signals.');
    } else {
      factors.push(`Clear Track Visibility (${(weather.visibility / 1000).toFixed(1)} km): Nominal optical aspect clearance.`);
    }
  }

  // 2. Precipitation & Rain Intensity
  if (weather.precipitation >= 15 || [65, 82, 95, 96, 99].includes(weather.weatherCode)) {
    delayImpact += 5;
    factors.push(`Heavy Precipitation (${weather.precipitation}mm/h) / Storm: Track ballast saturation caution.`);
    recommendations.push('Enforce wet-rail braking margins; inspect low-lying bridge sections.');
  } else if (weather.precipitation >= 3 || [61, 63, 80, 81].includes(weather.weatherCode)) {
    delayImpact += 2;
    factors.push(`Moderate Rain (${weather.precipitation}mm/h): Reduced rail-wheel adhesion coefficient.`);
  }

  // 3. High Winds & Catenary Sway
  if (weather.windSpeed >= 50) {
    delayImpact += 4;
    factors.push(`High Crosswinds (${weather.windSpeed} km/h): Overhead electric traction (OHE) catenary sway caution.`);
    recommendations.push('Monitor pantograph contact pressure along exposed viaducts.');
  } else if (weather.windSpeed >= 35) {
    delayImpact += 1;
    factors.push(`Moderate Winds (${weather.windSpeed} km/h).`);
  }

  // 4. Extreme Temperature Check
  if (weather.temperature !== null) {
    if (weather.temperature >= 44) {
      delayImpact += 2;
      factors.push(`Excessive Ambient Heat (${weather.temperature}°C): Continuous welded rail (CWR) expansion risk.`);
      recommendations.push('Conduct track thermal buckling inspections on sun-exposed straights.');
    }
  }

  if (factors.length === 0 || delayImpact === 0) {
    factors.push('Atmospheric conditions within nominal operating parameters.');
    recommendations.push('Standard sectional speed profile authorized.');
  }

  // Derive risk severity based on total atmospheric impact
  let severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (delayImpact >= 8) {
    severity = 'CRITICAL';
  } else if (delayImpact >= 4) {
    severity = 'HIGH';
  } else if (delayImpact >= 2) {
    severity = 'MODERATE';
  }

  const riskLabel =
    severity === 'CRITICAL'
      ? 'Critical Hazard'
      : severity === 'HIGH'
      ? 'Adverse Weather Caution'
      : severity === 'MODERATE'
      ? 'Minor Atmospheric Impact'
      : 'Nominal Operations';

  return {
    riskLevel: severity,
    riskLabel,
    predictedDelayImpactMinutes: delayImpact,
    riskFactors: factors,
    recommendations: recommendations.length > 0 ? recommendations : ['Normal operation'],
    attributionFactor: delayImpact,
    disclaimer:
      'Live weather observations provided by Open-Meteo. Operational delay impact is independently derived by RailPredict and does not represent an Open-Meteo prediction.',
  };
}
