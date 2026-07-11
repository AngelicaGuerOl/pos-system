import { useMemo } from 'react'
import type { NormalizedApiError } from '../../api/apiError'
import { getFormErrorMessage } from './errorParser'

export const useFormErrors = (error: NormalizedApiError | null) => {
  return useMemo(
    () => ({
      generalError: getFormErrorMessage(error),
      validationErrors: error?.validationErrors,
    }),
    [error],
  )
}

