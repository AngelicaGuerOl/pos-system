import axios from 'axios'

export type ApiValidationErrors = Record<string, string>

export type BackendErrorResponse = {
  timestamp?: string
  status?: number
  error?: string
  message?: string
  path?: string
  validationErrors?: ApiValidationErrors | null
}

export type NormalizedApiError = {
  status?: number
  message: string
  validationErrors?: ApiValidationErrors
}

const DEFAULT_ERROR_MESSAGE = 'No se pudo completar la operacion'

const isBackendErrorResponse = (value: unknown): value is BackendErrorResponse => {
  return typeof value === 'object' && value !== null
}

const getFallbackMessageByStatus = (status?: number): string => {
  if (status === 400) {
    return 'La solicitud no es valida. Revisa los datos ingresados.'
  }

  if (status === 401) {
    return 'Usuario o contrasena incorrectos.'
  }

  if (status === 403) {
    return 'No tienes permiso para realizar esta accion.'
  }

  if (status === 404) {
    return 'No se encontro el endpoint de login. Revisa que el backend este encendido y que VITE_API_BASE_URL apunte a la API correcta.'
  }

  if (status && status >= 500) {
    return 'El servidor tuvo un problema. Intenta de nuevo o revisa los logs del backend.'
  }

  return DEFAULT_ERROR_MESSAGE
}

export const normalizeApiError = (error: unknown): NormalizedApiError => {
  if (!axios.isAxiosError(error)) {
    return { message: DEFAULT_ERROR_MESSAGE }
  }

  if (!error.response) {
    return {
      message: 'No se pudo conectar con el backend. Revisa que este encendido y que VITE_API_BASE_URL sea correcto.',
    }
  }

  const data = error.response?.data
  const status = error.response?.status

  if (isBackendErrorResponse(data)) {
    return {
      status: data.status ?? status,
      message: data.message ?? getFallbackMessageByStatus(status),
      validationErrors: data.validationErrors ?? undefined,
    }
  }

  return {
    status,
    message: getFallbackMessageByStatus(status),
  }
}
