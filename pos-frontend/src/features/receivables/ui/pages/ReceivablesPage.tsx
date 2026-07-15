import SyncRoundedIcon from '@mui/icons-material/SyncRounded'
import { Alert, Button, CircularProgress, Stack, TablePagination } from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '../../../../shared/routes/routePaths'
import { DataGridShell } from '../../../../shared/ui/components/DataGridShell'
import { EmptyState } from '../../../../shared/ui/components/EmptyState'
import { PageHeader } from '../../../../shared/ui/components/PageHeader'
import { AccountsReceivableCustomersTable } from '../components/AccountsReceivableCustomersTable'
import { AccountsReceivableFilters } from '../components/AccountsReceivableFilters'
import { useReceivableCustomerContacts } from '../hooks/useReceivableCustomerContacts'
import { useReceivables } from '../hooks/useReceivables'
import type { CustomerDebtStatusFilter } from '../types/accountsReceivable'
import { groupReceivablesByCustomer } from '../utils/accountsReceivable'

export const ReceivablesPage = () => {
  const navigate = useNavigate()
  const {
    error,
    loading,
    receivables,
    refetch,
    setPage,
    setSize,
    size,
    totalElements,
    page,
  } = useReceivables()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CustomerDebtStatusFilter>('OPEN')
  const customerPhones = useReceivableCustomerContacts(
    useMemo(() => receivables.map((receivable) => receivable.customerId), [receivables]),
  )

  const customerRows = useMemo(
    () => groupReceivablesByCustomer(receivables, status, search, customerPhones),
    [customerPhones, receivables, search, status],
  )

  const clearFilters = () => {
    setSearch('')
    setStatus('OPEN')
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle="Consulta clientes con compras fiadas y saldos pendientes."
        title="Cuentas por cobrar"
      />

      <DataGridShell
        loading={loading}
        toolbar={
          <Stack spacing={2} sx={{ width: '100%' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
            >
              <Button
                disabled={loading}
                onClick={() => void refetch()}
                startIcon={loading ? <CircularProgress size={18} /> : <SyncRoundedIcon />}
              >
                Actualizar
              </Button>
            </Stack>
            <AccountsReceivableFilters
              onClear={clearFilters}
              onSearchChange={setSearch}
              onStatusChange={setStatus}
              search={search}
              status={status}
            />
          </Stack>
        }
      >
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}

          {!loading && customerRows.length === 0 ? (
            <EmptyState
              actionIcon={<SyncRoundedIcon />}
              actionLabel="Actualizar"
              message="No hay clientes para mostrar con los filtros actuales."
              onAction={() => void refetch()}
              title="Sin clientes"
            />
          ) : (
            <AccountsReceivableCustomersTable
              customers={customerRows}
              loading={loading}
              onOpenAccount={(customerId) =>
                navigate(ROUTE_PATHS.customerAccountReceivable.replace(':customerId', String(customerId)))}
            />
          )}

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
      </DataGridShell>
    </Stack>
  )
}
