export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    currency: 'MXN',
    style: 'currency',
  }).format(value)
}

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value)
}

export const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

