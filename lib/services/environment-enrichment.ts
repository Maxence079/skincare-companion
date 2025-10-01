/**
 * Environment Enrichment Service
 *
 * Automatically collects environmental data based on user's location
 * to reduce onboarding questions and improve skincare recommendations.
 * Updated to use FREE Open-Meteo API (no key required)
 */

export interface GeolocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  timezone: string;
}

export interface EnvironmentalContext {
  uv_index: number;
  uv_risk_level: 'low' | 'moderate' | 'high' | 'very_high' | 'extreme';
  humidity: number;
  humidity_level: 'very_dry' | 'dry' | 'moderate' | 'humid' | 'very_humid';
  pollution_aqi: number;
  pollution_level: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  temperature: number;
  climate_zone: 'arctic' | 'temperate' | 'tropical' | 'arid' | 'mediterranean';
  season: 'spring' | 'summer' | 'fall' | 'winter';
  water_hardness?: 'soft' | 'moderate' | 'hard' | 'very_hard';
}

export interface DeviceContext {
  timezone: string;
  timezone_offset: number;
  locale: string;
  screen_size: 'mobile' | 'tablet' | 'desktop';
  prefers_dark_mode: boolean;
  estimated_sleep_pattern?: 'early_bird' | 'night_owl' | 'irregular';
}

export interface EnrichedUserContext {
  geolocation: GeolocationData | null;
  environment: EnvironmentalContext | null;
  device: DeviceContext;
  timestamp: string;
}

/**
 * Fetch UV index and weather data from Open-Meteo API (FREE, no key required!)
 */
async function fetchWeatherData(lat: number, lon: number): Promise<{
  uv_index: number;
  humidity: number;
  temperature: number;
}> {
  try {
    // Use Open-Meteo API (free, reliable, no API key needed)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,uv_index&timezone=auto`;

    const weatherResponse = await fetch(weatherUrl, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();

    return {
      uv_index: weatherData.current.uv_index || 5,
      humidity: weatherData.current.relative_humidity_2m || 50,
      temperature: weatherData.current.temperature_2m || 20
    };
  } catch (error) {
    console.warn('[Environment] Weather data unavailable, using defaults:', error instanceof Error ? error.message : 'Unknown error');
    return { uv_index: 5, humidity: 50, temperature: 20 };
  }
}

/**
 * Fetch air quality data from Open-Meteo Air Quality API (FREE, no key required!)
 */
async function fetchAirQualityData(lat: number, lon: number): Promise<number> {
  try {
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&timezone=auto`;

    const response = await fetch(airQualityUrl, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`Air Quality API error: ${response.status}`);
    }

    const data = await response.json();
    const aqi = data.current.us_aqi || 125; // US AQI scale (0-500)

    return aqi;
  } catch (error) {
    console.warn('[Environment] Air quality data unavailable, using default:', error instanceof Error ? error.message : 'Unknown error');
    return 125; // Default moderate
  }
}

/**
 * Determine climate zone based on location and weather
 */
function determineClimateZone(lat: number, temp: number, humidity: number): EnvironmentalContext['climate_zone'] {
  const absLat = Math.abs(lat);

  // Arctic/Polar
  if (absLat > 66.5 || temp < 0) {
    return 'arctic';
  }

  // Tropical
  if (absLat < 23.5 && temp > 18 && humidity > 60) {
    return 'tropical';
  }

  // Arid/Desert
  if (humidity < 30 && temp > 15) {
    return 'arid';
  }

  // Mediterranean
  if (absLat > 30 && absLat < 45 && humidity < 70) {
    return 'mediterranean';
  }

  // Temperate (default)
  return 'temperate';
}

/**
 * Determine current season based on latitude and date
 */
function determineSeason(lat: number): EnvironmentalContext['season'] {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const isNorthern = lat >= 0;

  if (isNorthern) {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  } else {
    // Southern hemisphere - seasons are reversed
    if (month >= 2 && month <= 4) return 'fall';
    if (month >= 5 && month <= 7) return 'winter';
    if (month >= 8 && month <= 10) return 'spring';
    return 'summer';
  }
}

/**
 * Convert UV index to risk level
 */
function getUVRiskLevel(uvIndex: number): EnvironmentalContext['uv_risk_level'] {
  if (uvIndex < 3) return 'low';
  if (uvIndex < 6) return 'moderate';
  if (uvIndex < 8) return 'high';
  if (uvIndex < 11) return 'very_high';
  return 'extreme';
}

/**
 * Convert humidity to descriptive level
 */
function getHumidityLevel(humidity: number): EnvironmentalContext['humidity_level'] {
  if (humidity < 20) return 'very_dry';
  if (humidity < 40) return 'dry';
  if (humidity < 60) return 'moderate';
  if (humidity < 80) return 'humid';
  return 'very_humid';
}

/**
 * Convert AQI to pollution level
 */
function getPollutionLevel(aqi: number): EnvironmentalContext['pollution_level'] {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy_sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very_unhealthy';
  return 'hazardous';
}

/**
 * Estimate sleep pattern based on timezone offset from server
 */
function estimateSleepPattern(timezoneOffset: number): DeviceContext['estimated_sleep_pattern'] {
  const now = new Date();
  const localHour = now.getHours();
  const userHour = (localHour + timezoneOffset / 60) % 24;

  // Very rough estimation based on current usage time
  if (userHour >= 5 && userHour < 9) {
    return 'early_bird'; // Active early morning
  } else if (userHour >= 22 || userHour < 2) {
    return 'night_owl'; // Active late night
  }

  return 'irregular'; // Can't determine
}

/**
 * Enrich user context with environmental and device data
 */
export async function enrichUserContext(
  geolocation: GeolocationData | null
): Promise<EnrichedUserContext> {
  // Always collect device context (no permissions needed)
  const deviceContext: DeviceContext = {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezone_offset: new Date().getTimezoneOffset(),
    locale: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    screen_size: typeof window !== 'undefined'
      ? (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop')
      : 'desktop',
    prefers_dark_mode: typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
    estimated_sleep_pattern: estimateSleepPattern(new Date().getTimezoneOffset())
  };

  // If no geolocation, return device context only
  if (!geolocation) {
    return {
      geolocation: null,
      environment: null,
      device: deviceContext,
      timestamp: new Date().toISOString()
    };
  }

  // Fetch environmental data based on location
  try {
    const [weatherData, aqiData] = await Promise.all([
      fetchWeatherData(geolocation.latitude, geolocation.longitude),
      fetchAirQualityData(geolocation.latitude, geolocation.longitude)
    ]);

    const environmentalContext: EnvironmentalContext = {
      uv_index: weatherData.uv_index,
      uv_risk_level: getUVRiskLevel(weatherData.uv_index),
      humidity: weatherData.humidity,
      humidity_level: getHumidityLevel(weatherData.humidity),
      pollution_aqi: aqiData,
      pollution_level: getPollutionLevel(aqiData),
      temperature: weatherData.temperature,
      climate_zone: determineClimateZone(
        geolocation.latitude,
        weatherData.temperature,
        weatherData.humidity
      ),
      season: determineSeason(geolocation.latitude)
    };

    return {
      geolocation,
      environment: environmentalContext,
      device: deviceContext,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Environment] Failed to enrich context:', error);
    return {
      geolocation,
      environment: null,
      device: deviceContext,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Server-side function to enrich context (for API routes)
 */
export async function enrichUserContextServer(
  latitude: number | null,
  longitude: number | null,
  timezone?: string,
  userAgent?: string
): Promise<EnrichedUserContext> {
  const geolocation: GeolocationData | null = latitude && longitude
    ? {
        latitude,
        longitude,
        timezone: timezone || 'UTC'
      }
    : null;

  const deviceContext: DeviceContext = {
    timezone: timezone || 'UTC',
    timezone_offset: 0,
    locale: 'en-US',
    screen_size: userAgent?.toLowerCase().includes('mobile') ? 'mobile' : 'desktop',
    prefers_dark_mode: false
  };

  if (!geolocation) {
    return {
      geolocation: null,
      environment: null,
      device: deviceContext,
      timestamp: new Date().toISOString()
    };
  }

  try {
    const [weatherData, aqiData] = await Promise.all([
      fetchWeatherData(geolocation.latitude, geolocation.longitude),
      fetchAirQualityData(geolocation.latitude, geolocation.longitude)
    ]);

    const environmentalContext: EnvironmentalContext = {
      uv_index: weatherData.uv_index,
      uv_risk_level: getUVRiskLevel(weatherData.uv_index),
      humidity: weatherData.humidity,
      humidity_level: getHumidityLevel(weatherData.humidity),
      pollution_aqi: aqiData,
      pollution_level: getPollutionLevel(aqiData),
      temperature: weatherData.temperature,
      climate_zone: determineClimateZone(
        geolocation.latitude,
        weatherData.temperature,
        weatherData.humidity
      ),
      season: determineSeason(geolocation.latitude)
    };

    return {
      geolocation,
      environment: environmentalContext,
      device: deviceContext,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Environment] Failed to enrich context:', error);
    return {
      geolocation,
      environment: null,
      device: deviceContext,
      timestamp: new Date().toISOString()
    };
  }
}
