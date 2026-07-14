import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import {
  Alert,
  Box,
  Button,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TablePagination,
  Typography,
} from '@mui/material'
import type { Customer } from '../../../customers'
import { useEffect } from 'react'
import {
  RECEIVABLE_STATUS_LABELS,
  type ReceivableStatus,
} from '../../domain/entities/Receivable'
import { useCustomerReceivables } from '../hooks/useCustomerReceivables'
import { ReceivablesGrid } from './ReceivablesGrid'

type CustomerReceivablesDrawerProps = {
  customer: Customer | null
  onClose: () => void
  onViewDetails: (receivableId: number) => void
  open: boolean
  refreshKey?: number
}

const statusOptions: ReceivableStatus[] = ['PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']

export const CustomerReceivablesDrawer = ({
  customer,
  onClose,
  onViewDetails,
  open,
  refreshKey = 0,
}: CustomerReceivablesDrawerProps) => {
  const {
    error,
    filters,
    loading,
    page,
    receivables,
    refetch,
    setPage,
    setSize,
    setStatus,
    size,
    totalElements,
  } = useCustomerReceivables(customer?.id ?? null)

  useEffect(() => {
    if (open && customer) {
      void refetch()
    }
  }, [customer, open, refetch, refreshKey])

  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            maxWidth: '100%',
            width: { xs: '100%', md: 760 },
          },
        },
      }}
    >
      <Stack sx={{ minHeight: '100%' }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', borderBottom: 1, borderColor: 'divider', p: 2 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900 }} variant="h6">
              Cuentas por cobrar
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {customer?.fullName ?? 'Cliente'}
            </Typography>
          </Box>
          <IconButton aria-label="Cerrar cuentas por cobrar" onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        {loading ? <LinearProgress /> : <Box sx={{ height: 4 }} />}

        <Stack spacing={2} sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
          >
            <Button
              disabled={loading}
              onClick={() => void refetch()}
              startIcon={<SyncRoundedIcon />}
            >
              Actualizar
            </Button>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="customer-receivable-status-label">Estado</InputLabel>
              <Select
                label="Estado"
                labelId="customer-receivable-status-label"
                onChange={(event) => setStatus(event.target.value as ReceivableStatus | '')}
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
          </Stack>

          {error ? <Alert severity="error">{error.message}</Alert> : null}

          <ReceivablesGrid
            loading={loading}
            onViewDetails={onViewDetails}
            receivables={receivables}
          />

          <TablePagination
            component="div"
            count={totalElements}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            labelRowsPerPage="Filas por pagina"
            onPageChange={(_event, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => setSize(Number(event.target.value))}
            page={page}
            rowsPerPage={size}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Stack>
      </Stack>
    </Drawer>
  )
}
