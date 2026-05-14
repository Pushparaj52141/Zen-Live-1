import axios from 'axios'
import { endpoints } from './endpoints'

// Keep axios and RTK Query aligned on the same base URL strategy.
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // Relative fallback (works with dev proxy)
  return '/api'
}

export const API_BASE_URL = getBaseUrl()

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // CRITICAL: This allows cookies to be sent automatically with every request
})

// Request interceptor - No need to manually add Authorization header
// Cookies (both accessToken and refreshToken) are sent automatically by the browser
apiClient.interceptors.request.use(
  (config) => {
    // Both accessToken and refreshToken are sent automatically as cookies
    return config
  },
  (error) => Promise.reject(error)
)

let refreshPromise

const requestRefreshToken = () => {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post(endpoints.auth.refresh, null, { skipAuthRefresh: true })
      .then((response) => {
        refreshPromise = null
        return response.data
      })
      .catch((error) => {
        refreshPromise = null
        throw error
      })
  }
  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error

    // Skip refresh logic for refresh token endpoint itself
    if (config?.skipAuthRefresh) {
      return Promise.reject(error)
    }

    // Skip refresh logic for login endpoint
    if (config?.url?.includes('/login')) {
      return Promise.reject(error)
    }

    // Handle 401 errors (expired access token)
    if (response?.status === 401 && !config?._retry) {
      config._retry = true

      try {
        // Request new tokens - cookies will be updated automatically by backend
        await requestRefreshToken()

        // Retry the original request - new cookies will be sent automatically
        return apiClient(config)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient;
