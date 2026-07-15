import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'
import { formatCurrency } from '../../../../shared/utils/formatters'
import type { CustomerDebtSummary } from '../types/accountsReceivable'

ModuleRegistry.registerModules([AllCommunityModule])

type AccountsReceivableCustomersTableProps = {
  customers: CustomerDebtSummary[]
  loading: boolean
  onOpenAccount: (customerId: number) => void
}

export const AccountsReceivableCustomersTable = ({
  customers,
  loading,
  onOpenAccount,
}: AccountsReceivableCustomersTableProps) => {
  const columnDefs = useMemo<ColDef<CustomerDebtSummary>[]>(
    () => [
      {
        field: 'customerFullName',
        flex: 1.4,
        headerName: 'Cliente',
        minWidth: 210,
        cellRenderer: ({ data, value }: ICellRendererParams<CustomerDebtSummary, string>) => (
          <Stack spacing={0}>
            <Typography noWrap sx={{ fontSize: 'inherit', fontWeight: 700 }}>
              {value}
            </Typography>
            {data?.customerPhone ? (
              <Typography color="text.secondary" noWrap sx={{ fontSize: 12 }}>
                {data.customerPhone}
              </Typography>
            ) : null}
          </Stack>
        ),
      },
      {
        field: 'creditSalesCount',
        headerName: 'Compras fiadas',
        minWidth: 125,
      },
      {
        field: 'adjustedAmount',
        headerName: 'Deuda actual',
        minWidth: 130,
        valueFormatter: ({ value }) => formatCurrency(Number(value)),
      },
      {
        field: 'paidAmount',
        headerName: 'Total abonado',
        minWidth: 130,
        valueFormatter: ({ value }) => formatCurrency(Number(value)),
      },
      {
        field: 'outstandingBalance',
        headerName: 'Saldo pendiente',
        minWidth: 140,
        valueFormatter: ({ value }) => formatCurrency(Number(value)),
      },
      {
        field: 'status',
        headerName: 'Estado',
        minWidth: 120,
        cellRenderer: ({ data }: ICellRendererParams<CustomerDebtSummary>) =>
          data ? (
            <Chip
              color={data.status === 'OPEN' ? 'warning' : 'success'}
              label={data.status === 'OPEN' ? 'Con saldo' : 'Liquidado'}
              size="small"
              variant={data.status === 'OPEN' ? 'filled' : 'outlined'}
            />
          ) : null,
      },
      {
        colId: 'actions',
        headerName: 'Accion',
        minWidth: 190,
        sortable: false,
        cellRenderer: ({ data }: ICellRendererParams<CustomerDebtSummary>) =>
          data ? (
            <Button
              onClick={() => onOpenAccount(data.customerId)}
              size="small"
              startIcon={<VisibilityRoundedIcon />}
            >
              Ver estado de cuenta
            </Button>
          ) : null,
      },
    ],
    [onOpenAccount],
  )
  const gridHeight = Math.min(Math.max(customers.length * 48 + 58, 180), 520)

  return (
    <Box className="ag-theme-balham pos-data-grid" sx={{ height: gridHeight, width: '100%' }}>
      <AgGridReact<CustomerDebtSummary>
        animateRows
        columnDefs={columnDefs}
        defaultColDef={{ filter: false, resizable: true, sortable: false }}
        getRowId={({ data }) => data.customerId.toString()}
        loading={loading}
        noRowsOverlayComponent={() => (
          <Typography color="text.secondary" variant="body2">
            No hay clientes con cuentas por cobrar para mostrar.
          </Typography>
        )}
        onRowClicked={({ data, event }) => {
          const target = event?.target as HTMLElement | null
          if (data && !target?.closest('button')) {
            onOpenAccount(data.customerId)
          }
        }}
        rowData={customers}
        rowHeight={48}
        theme="legacy"
      />
    </Box>
  )
}
