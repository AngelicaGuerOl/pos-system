import { normalizeApiError } from '../../api/apiError'

type ExtractedApiErrors = {
  fieldErrors: Record<string, string>
  globalMessage: string
  isValidationError: boolean
}

export const extractApiErrors = (
  error: unknown,
  mapErrors: Record<string, string> = {},
): ExtractedApiErrors => {
  const normalizedError = normalizeApiError(error)
  const validationErrors = normalizedError.validationErrors ?? {}

  const fieldErrors = Object.entries(validationErrors).reduce<Record<string, string>>(
    (accumulator, [field, message]) => {
      accumulator[mapErrors[field] ?? field] = message
      return accumulator
    },
    {},
  )

  return {
    fieldErrors,
    globalMessage: normalizedError.message,
    isValidationError: Object.keys(fieldErrors).length > 0,
  }
}
