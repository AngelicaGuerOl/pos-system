import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { normalizeApiError } from '../../../../shared/api/apiError'
import { customerDependencies } from '../../../customers/dependencies'
import type { Customer } from '../../../customers/domain/entities/Customer'
import { userDependencies } from '../../../users/dependencies'
import type { User } from '../../../users/domain/entities/User'
import {
  SALE_STATUS_LABELS,
  type SaleHistoryFilters as SaleHistoryFiltersValue,
  type SaleStatus,
} from '../../domain/entities/Sale'

type SalesHistoryFiltersProps = {
  filters: SaleHistoryFiltersValue
  onChange: (filters: Partial<SaleHistoryFiltersValue>) => void
  onClear: () => void
}

const getCustomerLabel = (customer: Customer): string => customer.fullName

const getUserLabel = (user: User): string => user.username

export const SalesHistoryFilters = ({
  filters,
  onChange,
  onClear,
}: SalesHistoryFiltersProps) => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [customersLoading, setCustomersLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const loadCustomers = useCallback(async (search: string) => {
    setCustomersLoading(true)
    setLookupError(null)

    try {
      const data = await customerDependencies.getCustomersUseCase.execute({
        search: search.trim() || undefined,
        size: 10,
      })
      setCustomers(data.content)
    } catch (unknownError) {
      setLookupError(normalizeApiError(unknownError).message)
    } finally {
      setCustomersLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async (search: string) => {
    setUsersLoading(true)
    setLookupError(null)

    try {
      const data = await userDependencies.getUsersUseCase.execute({
        search: search.trim() || undefined,
        size: 10,
      })
      setUsers(data.content)
    } catch (unknownError) {
      setLookupError(normalizeApiError(unknownError).message)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCustomers(customerSearch)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [customerSearch, loadCustomers])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadUsers(userSearch)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [loadUsers, userSearch])

  useEffect(() => {
    if (!filters.customerId) {
      setSelectedCustomer(null)
    }
    if (!filters.createdByUserId) {
      setSelectedUser(null)
    }
  }, [filters.createdByUserId, filters.customerId])

  const customerOptions = useMemo(() => {
    if (selectedCustomer && !customers.some((customer) => customer.id === selectedCustomer.id)) {
      return [selectedCustomer, ...customers]
    }

    return customers
  }, [customers, selectedCustomer])

  const userOptions = useMemo(() => {
    if (selectedUser && !users.some((user) => user.id === selectedUser.id)) {
      return [selectedUser, ...users]
    }

    return users
  }, [selectedUser, users])

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { xs: 'stretch', lg: 'center' } }}
      >
        <TextField
          label="Folio"
          onChange={(event) =>
            onChange({ folio: event.target.value ? Number(event.target.value) : undefined })
          }
          size="small"
          sx={{ minWidth: { xs: '100%', lg: 140 } }}
          type="number"
          value={filters.folio ?? ''}
        />

        <Autocomplete<Customer>
          filterOptions={(options) => options}
          getOptionLabel={getCustomerLabel}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={customersLoading}
          onChange={(_event, customer) => {
            setSelectedCustomer(customer)
            onChange({ customerId: customer?.id })
          }}
          onInputChange={(_event, value) => setCustomerSearch(value)}
          options={customerOptions}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Cliente"
              size="small"
              slotProps={{
                input: {
                  ...params.slotProps.input,
                  endAdornment: (
                    <>
                      {customersLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.slotProps.input.endAdornment}
                    </>
                  ),
                },
                htmlInput: params.slotProps.htmlInput,
                inputLabel: params.slotProps.inputLabel,
              }}
            />
          )}
          renderOption={(props, customer) => (
            <Box component="li" {...props} key={customer.id}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontWeight: 800 }}>{customer.fullName}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {customer.phone ?? 'Sin telefono'}
                </Typography>
              </Stack>
            </Box>
          )}
          size="small"
          sx={{ minWidth: { xs: '100%', lg: 280 } }}
          value={selectedCustomer}
        />

        <Autocomplete<User>
          filterOptions={(options) => options}
          getOptionLabel={getUserLabel}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={usersLoading}
          onChange={(_event, user) => {
            setSelectedUser(user)
            onChange({ createdByUserId: user?.id })
          }}
          onInputChange={(_event, value) => setUserSearch(value)}
          options={userOptions}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Cajero"
              size="small"
              slotProps={{
                input: {
                  ...params.slotProps.input,
                  endAdornment: (
                    <>
                      {usersLoading ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.slotProps.input.endAdornment}
                    </>
                  ),
                },
                htmlInput: params.slotProps.htmlInput,
                inputLabel: params.slotProps.inputLabel,
              }}
            />
          )}
          size="small"
          sx={{ minWidth: { xs: '100%', lg: 220 } }}
          value={selectedUser}
        />

        <FormControl size="small" sx={{ minWidth: { xs: '100%', lg: 160 } }}>
          <InputLabel>Estado</InputLabel>
          <Select
            label="Estado"
            onChange={(event) =>
              onChange({
                status: event.target.value ? (event.target.value as SaleStatus) : undefined,
              })
            }
            value={filters.status ?? ''}
          >
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(SALE_STATUS_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
      >
        <TextField
          label="Fecha inicial"
          onChange={(event) => onChange({ from: event.target.value || undefined })}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          type="datetime-local"
          value={filters.from ?? ''}
        />
        <TextField
          label="Fecha final"
          onChange={(event) => onChange({ to: event.target.value || undefined })}
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          type="datetime-local"
          value={filters.to ?? ''}
        />
        <Button onClick={onClear} startIcon={<ClearRoundedIcon />}>
          Limpiar filtros
        </Button>
        {lookupError ? (
          <Typography color="error" variant="body2">
            {lookupError}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  )
}
