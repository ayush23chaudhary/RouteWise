import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

export const apiClient = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach correlation ID + JWT token
apiClient.interceptors.request.use((config) => {
  config.headers['X-Correlation-ID'] = uuidv4()
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Response interceptor — normalize RFC 7807 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const problemDetails = error.response?.data
    if (problemDetails?.type) {
      return Promise.reject(problemDetails)
    }
    return Promise.reject({
      type: 'https://routewise.ai/errors/network-error',
      title: 'Network Error',
      status: 0,
      detail: 'Unable to reach the server. Please check your connection.',
      correlation_id: '',
    })
  }
)
