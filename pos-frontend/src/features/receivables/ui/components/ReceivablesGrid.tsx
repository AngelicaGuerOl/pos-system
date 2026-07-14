import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { Box, Button, Typography } from '@mui/material'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'
import { formatCurrency, formatDateTime } from '../../../../shared/utils/formatters'
import type { Receivable } from '../../domain/entities/Receivable'
import { ReceivableStatusChip } from './ReceivableStatusChip'

ModuleRegistry.registerModules([AllCommunityModule])

type ReceivablesGridProps = {
  loading: boolean
  onViewDetails: (receivableId: number) => void
  receivables: Receivable[]
}

export const ReceivablesGrid = ({
  loading,
  onViewDetails,
  receivables,
}: ReceivablesGridProps) => {
  const columnDefs = useMemo<ColDef<Receivable>[]>(
    () => [
      {
        field: 'id',
        headerName: 'Folio de deuda',
        maxWidth: 150,
        minWidth: 130,
        valueFormatter: ({ value }) => `#${value}`,
      },
      {
        field: 'saleId',
        headerName: 'Venta',
        maxWidth: 120,
        minWidth: 110,
        valueFormatter: ({ value }) => `#${value}`,
      },
      {
        field: 'createdAt',
        headerName: 'Fecha',
        minWidth: 180,
        valueFormatter: ({ value }) => formatDateTime(value as string | null | undefined),
      },
      {
        field: 'customerFullName',
        flex: 1,
        headerName: 'Cliente',
        minWidth: 220,
        cellRenderer: ({ value }: ICellRendererParams<Receivable, string>) => (
          <Typography noWrap sx={{ fontSize: 'inherit' }}>
            {value}
          </Typography>
        ),
      },
      {
        field: 'originalAmount',
        headerName: 'Monto original',
        minWidth: 150,
        valueFormatter: ({ value }) => formatCurrency(Number(value)),
      },
      {
        field: 'paidAmount',
        headerName: 'Pagado',
        minWidth: 130,
        valueFormatter: ({ value }) => formatCurrency(Number(value)),
      },
      {
        field: 'outstandingBalance',
        headerName: 'Saldo pendiente',
        minWidth: 160,
        valueFormatter: ({ value }) => formatCurrency(Number(value)),
      },
      {
        field: 'status',
        headerName: 'Estado',
        minWidth: 170,
        cellRenderer: ({ data }: ICellRendererParams<Receivable>) =>
          data ? <ReceivableStatusChip status={data.status} /> : null,
      },
      {
        colId: 'actions',
        headerName: '',
        maxWidth: 140,
        minWidth: 130,
        sortable: false,
        cellRenderer: ({ data }: ICellRendererParams<Receivable>) =>
          data ? (
            <Button
              onClick={() => onViewDetails(data.id)}
              size="small"
              startIcon={<VisibilityRoundedIcon />}
            >
              Ver
            </Button>
          ) : null,
      },
    ],
    [onViewDetails],
  )

  return (
    <Box className="ag-theme-balham pos-data-grid" sx={{ height: 500, width: '100%' }}>
      <AgGridReact<Receivable>
        animateRows
        columnDefs={columnDefs}
        defaultColDef={{ filter: false, resizable: true, sortable: false }}
        getRowId={({ data }) => data.id.toString()}
        loading={loading}
        noRowsOverlayComponent={() => (
          <Typography color="text.secondary" variant="body2">
            No hay cuentas por cobrar para mostrar.
          </Typography>
        )}
        rowData={receivables}
        rowHeight={46}
        theme="legacy"
      />
    </Box>
  )
}
