import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded'
import {
  Autocomplete,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { normalizeApiError } from '../../../../shared/api/apiError'
import { customerDependencies } from '../../dependencies'
import type { Customer } from '../../domain/entities/Customer'

type CustomerSelectorProps = {
  disabled?: boolean
  error?: string
  label?: string
  onChange: (customer: Customer | null) => void
  required?: boolean
  value: Customer | null
}

const getDisplayName = (customer: Customer): string => {
  return customer.fullName || `${customer.firstName} ${customer.lastName}`.trim()
}

const getOptionLabel = (customer: Customer): string => {
  const phone = customer.phone ? ` · ${customer.phone}` : ''
  return `${getDisplayName(customer)}${phone}`
}

export const CustomerSelector = ({
  disabled = false,
  error,
  label = 'Cliente',
  onChange,
  required = false,
  value,
}: CustomerSelectorProps) => {
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const helperText = useMemo(() => {
    if (error) {
      return error
    }
    if (loadError) {
      return loadError
    }
    return required ? 'Selecciona un cliente activo.' : 'Busca por nombre, apellido o telefono.'
  }, [error, loadError, required])

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setLoadError(null)

      try {
        const page = await customerDependencies.getCustomersUseCase.execute({
          page: 0,
          search: inputValue.trim() || undefined,
          size: 10,
          sort: 'firstName,asc',
        })
        setOptions(page.content.filter((customer) => customer.active))
      } catch (unknownError) {
        setOptions([])
        setLoadError(normalizeApiError(unknownError).message)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [inputValue])

  return (
    <Autocomplete<Customer, false, false, false>
      clearOnBlur={false}
      disabled={disabled}
      filterOptions={(customers) => customers}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      loading={loading}
      loadingText="Buscando clientes..."
      noOptionsText="No se encontraron clientes activos."
      onChange={(_event, customer) => onChange(customer)}
      onInputChange={(_event, nextValue) => setInputValue(nextValue)}
      options={options}
      renderInput={(params) => (
        <TextField
          {...params}
          error={Boolean(error || loadError)}
          helperText={helperText}
          label={label}
          required={required}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <InputAdornment position="start">
                  <PersonSearchRoundedIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  {loading ? <CircularProgress color="inherit" size={18} /> : null}
                  {value ? (
                    <IconButton
                      aria-label="Limpiar cliente"
                      disabled={disabled}
                      onClick={() => onChange(null)}
                      size="small"
                    >
                      <ClearRoundedIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                  {params.slotProps.input.endAdornment}
                </Stack>
              ),
            },
          }}
        />
      )}
      renderOption={(props, customer) => (
        <Box component="li" {...props} key={customer.id}>
          <Stack spacing={0.25}>
            <Typography sx={{ fontWeight: 800 }}>{getDisplayName(customer)}</Typography>
            <Typography color="text.secondary" variant="body2">
              {customer.phone || 'Sin telefono'}
            </Typography>
          </Stack>
        </Box>
      )}
      value={value}
    />
  )
}
