import { TextField } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import type { TextFieldProps } from '@mui/material'

export type CalendarioPickerProps = {
  disabled?: boolean
  error?: boolean
  fullWidth?: boolean
  helperText?: string
  label?: string
  mayorDeEdad?: boolean
  onChange: (value: string | null) => void
  size?: TextFieldProps['size']
  sx?: SxProps<Theme>
  value: string | null
}

export const CalendarioPicker = ({
  disabled = false,
  error = false,
  fullWidth = true,
  helperText,
  label = 'Fecha de nacimiento',
  mayorDeEdad = false,
  onChange,
  size = 'small',
  sx,
  value,
}: CalendarioPickerProps) => {
  const maxDate = mayorDeEdad ? getDateYearsAgo(18) : undefined

  return (
    <TextField
      disabled={disabled}
      error={error}
      fullWidth={fullWidth}
      helperText={helperText}
      label={label}
      onChange={(event) => onChange(event.target.value || null)}
      size={size}
      slotProps={{
        htmlInput: {
          max: maxDate,
        },
        inputLabel: {
          shrink: true,
        },
      }}
      sx={sx}
      type="date"
      value={toDateInputValue(value)}
    />
  )
}

const toDateInputValue = (value: string | null): string => {
  if (!value) {
    return ''
  }

  return value.slice(0, 10)
}

const getDateYearsAgo = (years: number): string => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - years)
  return date.toISOString().slice(0, 10)
}
