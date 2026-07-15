export const toStartOfDayISOString = (value?: string): string | undefined => {
  const dateValue = toDateValue(value)
  if (!dateValue) {
    return undefined
  }

  return new Date(`${dateValue}T00:00:00`).toISOString()
}

export const toEndOfDayISOString = (value?: string): string | undefined => {
  const dateValue = toDateValue(value)
  if (!dateValue) {
    return undefined
  }

  return new Date(`${dateValue}T23:59:59.999`).toISOString()
}

const toDateValue = (value?: string): string | undefined => {
  const normalizedValue = value?.trim()
  if (!normalizedValue) {
    return undefined
  }

  return normalizedValue.slice(0, 10)
}
