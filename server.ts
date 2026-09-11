import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { serverRailwayService, getISTDateString } from './server/railwayProviders';
import { xgboostEtaService } from './server/xgboostEtaService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(express.json());

// Clear any stale cached telemetry on server boot
serverRailwayService.clearCache();

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const isRailRadarConfigured = serverRailwayService.isConfigured();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    railwayProvider: 'RailRadar',
    isConfigured: isRailRadarConfigured,
    service: 'RailPredict Centralized RailRadar Backend',
  });
});

// Config status endpoint (safe: never leaks the secret key)
app.get('/api/config', (_req: Request, res: Response) => {
  const isRailRadarConfigured = serverRailwayService.isConfigured();
  res.json({
    configured: isRailRadarConfigured,
    railwayProvider: {
      name: 'RailRadar',
      configured: isRailRadarConfigured,
      rateLimited: serverRailwayService.isRateLimited(),
      cooldownRemaining: serverRailwayService.getCooldownRemaining(),
    },
    cacheTtlSeconds: 60,
  });
});

// Cache reset endpoint
app.post('/api/cache/clear', (_req: Request, res: Response) => {
  serverRailwayService.clearCache();
  res.json({ success: true, message: 'Server railway telemetry cache and cooldown cleared.' });
});

// Train search endpoint
app.get('/api/trains/search', (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const knownTrains = [
    { num: '12625', name: 'Kerala SF Express', route: 'NDLS → TVC', type: 'Superfast' },
    { num: '12760', name: 'Charminar SF Express', route: 'HYB → TBM', type: 'Superfast' },
    { num: '12919', name: 'Malwa SF Express', route: 'INDB → SVDK', type: 'Superfast' },
    { num: '12028', name: 'Shatabdi Express', route: 'SBC → MAS', type: 'Shatabdi' },
    { num: '17016', name: 'Visakha Express', route: 'SC → BBS', type: 'Express' },
    { num: '11013', name: 'Mumbai Express', route: 'LTT → CBE', type: 'Express' },
    { num: '16031', name: 'Andaman Express', route: 'MAS → SVDK', type: 'Express' },
  ];

  if (!q) {
    return res.json({ success: true, trains: knownTrains });
  }

  const results = knownTrains.filter(
    (t) => t.num.includes(q) || t.name.toLowerCase().includes(q) || t.route.toLowerCase().includes(q)
  );
  res.json({ success: true, trains: results });
});

// Station live board endpoint: GET /api/stations/:stationCode/live
app.get('/api/stations/:stationCode/live', async (req: Request, res: Response) => {
  const stationCode = req.params.stationCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{2,6}$/.test(stationCode)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATION_CODE',
        message: `Invalid station code "${stationCode}". Station codes are 2 to 6 characters (e.g. BZA, SC, NDLS).`,
      },
    });
  }

  const hours = parseInt(String(req.query.hours || '4'), 10) || 4;
  const includeIntermediate = req.query.includeIntermediate !== 'false';
  const isAuthoritative = req.query.authoritative === 'true';

  const result = await serverRailwayService.getLiveStation(stationCode, {
    hours,
    includeIntermediate,
    authoritative: isAuthoritative,
  });

  return res.status(result.status).json(result);
});

// Primary live train tracking endpoint: GET /api/trains/:number/live
app.get('/api/trains/:number/live', async (req: Request, res: Response) => {
  const trainNumber = req.params.number.trim();

  // Validate train number format (standard Indian Railways trains are 4 or 5 digits)
  if (!/^\d{4,5}$/.test(trainNumber)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_TRAIN_NUMBER',
        message: `Invalid train number "${trainNumber}". Train numbers must be 4 or 5 numeric digits (e.g. 12625).`,
      },
    });
  }

  const currentISTDate = getISTDateString();
  const requestedDate = req.query.date ? String(req.query.date).trim() : currentISTDate;

  // Validate journey date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JOURNEY_DATE',
        message: `Invalid journey date "${requestedDate}". Date must be in YYYY-MM-DD format (e.g. ${currentISTDate}).`,
      },
    });
  }

  const isAuthoritative = req.query.authoritative === 'true';

  const result = await serverRailwayService.getLiveTrain(trainNumber, requestedDate, {
    authoritative: isAuthoritative,
  });

  return res.status(result.status).json(result);
});

// Trains Between Stations endpoint: GET /api/trains/between/:from/:to
app.get('/api/trains/between/:from/:to', async (req: Request, res: Response) => {
  const fromCode = req.params.from.trim().toUpperCase();
  const toCode = req.params.to.trim().toUpperCase();

  if (!/^[A-Z0-9]{2,6}$/.test(fromCode) || !/^[A-Z0-9]{2,6}$/.test(toCode)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATION_PAIR',
        message: 'Valid origin and destination station codes are required (e.g. NDLS to BZA).',
      },
    });
  }

  const currentISTDate = getISTDateString();
  const requestedDate = req.query.date ? String(req.query.date).trim() : currentISTDate;

  const result = await serverRailwayService.getTrainsBetween(fromCode, toCode, requestedDate);
  return res.status(result.status).json(result);
});

// XGBoost ETA Prediction Interface: GET and POST /api/predict/eta
// Pipeline: RailRadar live data -> feature extraction -> XGBoost ETA prediction interface -> ETA response
app.all('/api/predict/eta', async (req: Request, res: Response) => {
  try {
    const trainNumber = (req.query.trainNumber || req.body?.trainNumber || '').toString().trim();
    const currentISTDate = getISTDateString();
    const journeyDate = (req.query.date || req.body?.journeyDate || req.body?.date || currentISTDate).toString().trim();

    let trainData = req.body?.trainData;

    // If trainData was not provided directly in request body, fetch real live RailRadar data
    if (!trainData) {
      if (!/^\d{4,5}$/.test(trainNumber)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TRAIN_NUMBER',
            message: 'A valid 4 or 5 digit train number is required for ETA feature extraction and prediction.',
          },
        });
      }

      // Query real live RailRadar data via serverRailwayService (uses 60s cache + deduplication)
      const liveRes = await serverRailwayService.getLiveTrain(trainNumber, journeyDate, {
        authoritative: req.query.authoritative === 'true',
      });

      if (!liveRes.success || !liveRes.data) {
        return res.status(liveRes.status || 502).json({
          success: false,
          error: {
            code: liveRes.error?.code || 'LIVE_TELEMETRY_UNAVAILABLE',
            message: `Cannot extract features: live RailRadar data unavailable (${liveRes.error?.message || 'Error fetching telemetry'}).`,
          },
        });
      }

      trainData = liveRes.data;
    }

    // Pass genuine live RailRadar data to feature extraction & XGBoost prediction layer
    const predictionResult = await xgboostEtaService.predictEta(trainData);
    return res.json(predictionResult);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'PREDICTION_SERVICE_ERROR',
        message: `Error processing ETA prediction pipeline: ${err.message || 'Internal error'}`,
      },
    });
  }
});

// In-memory cache for Open-Meteo weather responses (15-minute TTL)
const weatherCache = new Map<string, { data: any; timestamp: number }>();
const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000;

function getWmoWeatherInfo(code: number): { description: string; icon: string; condition: string } {
  switch (code) {
    case 0:
      return { description: 'Clear Sky', icon: '☀️', condition: 'clear' };
    case 1:
      return { description: 'Mainly Clear', icon: '🌤', condition: 'clear' };
    case 2:
      return { description: 'Partly Cloudy', icon: '⛅', condition: 'cloudy' };
    case 3:
      return { description: 'Overcast', icon: '☁️', condition: 'overcast' };
    case 45:
      return { description: 'Fog', icon: '🌫', condition: 'fog' };
    case 48:
      return { description: 'Depositing Rime Fog', icon: '🌫', condition: 'fog' };
    case 51:
    case 53:
    case 55:
      return { description: 'Drizzle', icon: '🌦', condition: 'drizzle' };
    case 56:
    case 57:
      return { description: 'Freezing Drizzle', icon: '🌨', condition: 'drizzle' };
    case 61:
      return { description: 'Slight Rain', icon: '🌧', condition: 'rain' };
    case 63:
      return { description: 'Moderate Rain', icon: '🌧', condition: 'rain' };
    case 65:
      return { description: 'Heavy Rain', icon: '🌧', condition: 'heavy_rain' };
    case 66:
    case 67:
      return { description: 'Freezing Rain', icon: '🌨', condition: 'rain' };
    case 71:
    case 73:
    case 75:
    case 77:
      return { description: 'Snow Fall', icon: '❄️', condition: 'snow' };
    case 80:
    case 81:
    case 82:
      return { description: 'Rain Showers', icon: '🌦', condition: 'showers' };
    case 85:
    case 86:
      return { description: 'Snow Showers', icon: '🌨', condition: 'snow' };
    case 95:
      return { description: 'Thunderstorm', icon: '⛈', condition: 'thunderstorm' };
    case 96:
    case 97:
    case 99:
      return { description: 'Thunderstorm with Hail', icon: '⛈', condition: 'thunderstorm' };
    default:
      return { description: 'Fair / Atmospheric', icon: '🌤', condition: 'unknown' };
  }
}

// Open-Meteo Weather Proxy Endpoint
app.get('/api/weather', async (req: Request, res: Response) => {
  const latStr = req.query.lat as string;
  const lngStr = req.query.lng as string;
  const stationCode = (req.query.stationCode as string)?.trim().toUpperCase();

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_COORDINATES',
        message: 'Valid latitude and longitude are required to fetch weather from Open-Meteo.',
      },
    });
  }

  // Cache key rounded to 2 decimal places (~1.1 km accuracy)
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    return res.json({
      ...cached.data,
      meta: {
        ...cached.data.meta,
        cached: true,
      },
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const openMeteoUrl = new URL('https://api.open-meteo.com/v1/forecast');
    openMeteoUrl.searchParams.set('latitude', lat.toString());
    openMeteoUrl.searchParams.set('longitude', lng.toString());
    openMeteoUrl.searchParams.set(
      'current',
      'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m'
    );
    openMeteoUrl.searchParams.set('hourly', 'visibility,precipitation_probability');
    openMeteoUrl.searchParams.set('timezone', 'Asia/Kolkata');
    openMeteoUrl.searchParams.set('forecast_days', '1');

    const upstreamRes = await fetch(openMeteoUrl.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'RailPredict/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      return res.status(upstreamRes.status).json({
        success: false,
        error: {
          code: `OPEN_METEO_ERROR_${upstreamRes.status}`,
          message: `Open-Meteo API returned HTTP ${upstreamRes.status}: ${errText.slice(0, 200)}`,
        },
      });
    }

    const openMeteoData: any = await upstreamRes.json();
    const current = openMeteoData.current || {};
    const hourly = openMeteoData.hourly || {};

    const weatherCode = typeof current.weather_code === 'number' ? current.weather_code : 0;
    const weatherInfo = getWmoWeatherInfo(weatherCode);

    let visibility: number | null = null;
    let precipitationProbability: number | null = null;

    if (Array.isArray(hourly.time) && hourly.time.length > 0) {
      const currentHourIso = current.time ? current.time.slice(0, 13) : '';
      let matchIdx = hourly.time.findIndex((t: string) => t.startsWith(currentHourIso));
      if (matchIdx === -1) matchIdx = 0;
      visibility =
        typeof hourly.visibility?.[matchIdx] === 'number' ? hourly.visibility[matchIdx] : null;
      precipitationProbability =
        typeof hourly.precipitation_probability?.[matchIdx] === 'number'
          ? hourly.precipitation_probability[matchIdx]
          : null;
    }

    const payload = {
      success: true,
      data: {
        temperature: current.temperature_2m ?? null,
        precipitation: current.precipitation ?? 0,
        precipitationProbability: precipitationProbability ?? 0,
        windSpeed: current.wind_speed_10m ?? 0,
        relativeHumidity: current.relative_humidity_2m ?? null,
        visibility,
        weatherCode,
        weatherDescription: weatherInfo.description,
        icon: weatherInfo.icon,
        condition: weatherInfo.condition,
        coordinates: {
          lat,
          lng,
        },
        stationCode: stationCode || null,
        source: 'Open-Meteo API',
        lastUpdatedAt: new Date().toISOString(),
      },
      meta: {
        source: 'open-meteo',
        cached: false,
        timestamp: new Date().toISOString(),
      },
    };

    weatherCache.set(cacheKey, {
      data: payload,
      timestamp: Date.now(),
    });

    return res.json(payload);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        error: {
          code: 'WEATHER_GATEWAY_TIMEOUT',
          message: 'Open-Meteo API request timed out after 8 seconds.',
        },
      });
    }

    return res.status(502).json({
      success: false,
      error: {
        code: 'WEATHER_NETWORK_FAILURE',
        message: `Failed to connect to Open-Meteo API: ${err.message || 'Network error'}`,
      },
    });
  }
});

// Vite middleware / production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
