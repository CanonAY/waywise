import axios from 'axios';

const API_BASE_URL = __DEV__ ? 'http://localhost:3000/api/v1' : 'https://api.routeoptimizer.app/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      // Handle token expiration
      // This will be caught by AuthContext
    }

    return Promise.reject(error);
  }
);

// API service functions
export const scheduleService = {
  parseSchedule: (scheduleText, timezone = 'UTC') =>
    apiClient.post('/schedules/parse', { schedule_text: scheduleText, timezone }),

  getSchedule: (scheduleId) =>
    apiClient.get(`/schedules/${scheduleId}`),
};

export const routeService = {
  optimizeRoute: (data) =>
    apiClient.post('/routes/optimize', data),

  getRoute: (routeId) =>
    apiClient.get(`/routes/${routeId}`),

  getRouteHistory: (limit = 20, offset = 0) =>
    apiClient.get(`/users/me/routes?limit=${limit}&offset=${offset}`),
};

export const trafficService = {
  getTrafficForecast: (originLat, originLon, destLat, destLon, departureTime) =>
    apiClient.get('/traffic/forecast', {
      params: {
        origin_lat: originLat,
        origin_lon: originLon,
        dest_lat: destLat,
        dest_lon: destLon,
        departure_time: departureTime,
      },
    }),
};

export const healthService = {
  getHealth: () => apiClient.get('/health'),
};