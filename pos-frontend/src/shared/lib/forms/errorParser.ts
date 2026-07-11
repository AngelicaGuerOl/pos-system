import type { NormalizedApiError } from '../../api/apiError'

export const getFormErrorMessage = (error: NormalizedApiError | null): string | null => {
  if (!error) {
    return null
  }

  if (error.status === 401) {
    return 'Usuario o contrasena incorrectos'
  }

  return error.message
}

