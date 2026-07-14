import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import {
  RECEIVABLE_STATUS_LABELS,
  type ReceivableFilters,
  type ReceivableStatus,
} from '../../domain/entities/Receivable'

type ReceivablesFiltersProps = {
  filters: ReceivableFilters
  onChange: (filters: Partial<ReceivableFilters>) => void
  onClear: () => void
}

const statusOptions: ReceivableStatus[] = ['PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']

const toNumberOrUndefined = (value: string): number | undefined => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export const ReceivablesFilters = ({
  filters,
  onChange,
  onClear,
}: ReceivablesFiltersProps) => (
  <Stack
    direction={{ xs: 'column', md: 'row' }}
    spacing={1.5}
    sx={{ alignItems: { xs: 'stretch', md: 'center' }, width: '100%' }}
  >
    <TextField
      label="Cliente ID"
      onChange={(event) => onChange({ customerId: toNumberOrUndefined(event.target.value) })}
      size="small"
      slotProps={{ htmlInput: { min: 1 } }}
      sx={{ minWidth: { md: 130 } }}
      type="number"
      value={filters.customerId ?? ''}
    />
    <TextField
      label="Venta"
      onChange={(event) => onChange({ saleId: toNumberOrUndefined(event.target.value) })}
      size="small"
      slotProps={{ htmlInput: { min: 1 } }}
      sx={{ minWidth: { md: 130 } }}
      type="number"
      value={filters.saleId ?? ''}
    />
    <FormControl size="small" sx={{ minWidth: { md: 190 } }}>
      <InputLabel id="receivable-status-filter-label">Estado</InputLabel>
      <Select
        label="Estado"
        labelId="receivable-status-filter-label"
        onChange={(event) =>
          onChange({ status: (event.target.value || undefined) as ReceivableStatus | undefined })
        }
        value={filters.status ?? ''}
      >
        <MenuItem value="">Todos</MenuItem>
        {statusOptions.map((status) => (
          <MenuItem key={status} value={status}>
            {RECEIVABLE_STATUS_LABELS[status]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    <TextField
      label="Desde"
      onChange={(event) => onChange({ from: event.target.value || undefined })}
      size="small"
      type="datetime-local"
      value={filters.from ?? ''}
    />
    <TextField
      label="Hasta"
      onChange={(event) => onChange({ to: event.target.value || undefined })}
      size="small"
      type="datetime-local"
      value={filters.to ?? ''}
    />
    <Button onClick={onClear} startIcon={<ClearRoundedIcon />}>
      Limpiar
    </Button>
    <Button disabled startIcon={<SearchRoundedIcon />} sx={{ display: { xs: 'none', lg: 'inline-flex' } }}>
      Filtros en base de datos
    </Button>
  </Stack>
)
