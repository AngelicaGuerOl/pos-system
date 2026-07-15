import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import type { CustomerDebtStatusFilter } from '../types/accountsReceivable'

type AccountsReceivableFiltersProps = {
  onClear: () => void
  onSearchChange: (search: string) => void
  onStatusChange: (status: CustomerDebtStatusFilter) => void
  search: string
  status: CustomerDebtStatusFilter
}

export const AccountsReceivableFilters = ({
  onClear,
  onSearchChange,
  onStatusChange,
  search,
  status,
}: AccountsReceivableFiltersProps) => (
  <Stack
    direction={{ xs: 'column', md: 'row' }}
    spacing={1.5}
    sx={{ alignItems: { xs: 'stretch', md: 'center' }, width: '100%' }}
  >
    <TextField
      label="Buscar por nombre o telefono"
      onChange={(event) => onSearchChange(event.target.value)}
      size="small"
      sx={{ minWidth: { md: 280 } }}
      value={search}
    />
    <FormControl size="small" sx={{ minWidth: { md: 180 } }}>
      <InputLabel id="customer-debt-status-filter">Estado</InputLabel>
      <Select
        label="Estado"
        labelId="customer-debt-status-filter"
        onChange={(event) => onStatusChange(event.target.value as CustomerDebtStatusFilter)}
        value={status}
      >
        <MenuItem value="OPEN">Con saldo</MenuItem>
        <MenuItem value="PAID">Liquidados</MenuItem>
        <MenuItem value="ALL">Todos</MenuItem>
      </Select>
    </FormControl>
    <Button onClick={onClear} startIcon={<ClearRoundedIcon />}>
      Limpiar
    </Button>
  </Stack>
)
