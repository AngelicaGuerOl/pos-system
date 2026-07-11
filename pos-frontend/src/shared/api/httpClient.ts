import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { env } from '../../app/config/env'
import { tokenStorage } from '../lib/storage/tokenStorage'

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 500
const REQUEST_TIMEOUT_MS = 30000

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retryCount?: number
}

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

const isAuthEndpoint = (url?: string): boolean => {
  return Boolean(url?.includes('/auth/') || url?.includes('/login') || url?.includes('/logout'))
}

const isRetryableNetworkError = (error: AxiosError): boolean => {
  if (error.response) {
    return false
  }

  if (isAuthEndpoint(error.config?.url)) {
    return false
  }

  return (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.message === 'Network Error'
  )
}

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: false,
})

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getToken()
  const isLoginEndpoint = config.url?.includes('/auth/login') ?? false

  if (token && !isLoginEndpoint) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableRequestConfig | undefined

    if (config && isRetryableNetworkError(error)) {
      config._retryCount = (config._retryCount ?? 0) + 1

      if (config._retryCount <= MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * config._retryCount)
        return httpClient(config)
      }
    }

    const isLoginEndpoint = error.config?.url?.includes('/auth/login') ?? false

    if (error.response?.status === 401 && !isLoginEndpoint) {
      tokenStorage.removeToken()

      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  },
)
