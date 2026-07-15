import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { Box, Button, Chip, Typography, useMediaQuery, useTheme } from '@mui/material'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'
import { formatCurrency, formatDateTime } from '../../../../shared/utils/formatters'
import {
  SALE_STATUS_LABELS,
  SALE_TYPE_LABELS,
  type SaleStatus,
  type SaleSummary,
} from '../../domain/entities/Sale'
import { ReceivableStatusChip } from '../../../receivables/ui/components/ReceivableStatusChip'

ModuleRegistry.registerModules([AllCommunityModule])

type SalesHistoryGridProps = {
  loading: boolean
  onViewDetails: (saleId: number) => void
  sales: SaleSummary[]
}

export const SalesHistoryGrid = ({ loading, onViewDetails, sales }: SalesHistoryGridProps) => {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('lg'))
  const narrow = useMediaQuery(theme.breakpoints.down('md'))

  const columnDefs = useMemo<ColDef<SaleSummary>[]>(
    () => [
      {
        field: 'id',
        headerName: 'Folio',
        flex: 0.55,
        maxWidth: 86,
        minWidth: 74,
        valueFormatter: ({ value }) => `#${value}`,
      },
      {
        field: 'createdAt',
        headerName: 'Fecha y hora',
        flex: 1.05,
        minWidth: 132,
        valueFormatter: ({ value }) => formatDateTime(value as string | null | undefined),
      },
      {
        field: 'createdByUsername',
        headerName: 'Cajero',
        flex: 0.8,
        hide: compact,
        minWidth: 105,
      },
      {
        field: 'customerFullName',
        flex: 1,
        headerName: 'Cliente',
        minWidth: narrow ? 135 : 170,
        cellRenderer: ({ value }: ICellRendererParams<SaleSummary, string>) => (
          <Typography noWrap sx={{ fontSize: 'inherit' }}>
            {value || 'Público general'}
          </Typography>
        ),
      },
      {
        field: 'saleType',
        headerName: 'Tipo',
        flex: 0.65,
        hide: narrow,
        minWidth: 86,
        valueFormatter: ({ value }) => SALE_TYPE_LABELS[value as SaleSummary['saleType']] ?? value,
      },
      {
        field: 'total',
        headerName: 'Total',
        flex: 0.75,
        minWidth: 95,
        valueFormatter: ({ value }) => formatCurrency(Number(value)),
      },
      {
        field: 'status',
        headerName: 'Estado de venta',
        flex: 0.95,
        minWidth: 128,
        cellRenderer: ({ value }: ICellRendererParams<SaleSummary, SaleStatus>) => (
          <Chip
            color={value === 'COMPLETED' ? 'success' : value === 'PARTIALLY_RETURNED' ? 'warning' : value === 'RETURNED' ? 'info' : 'default'}
            label={value ? SALE_STATUS_LABELS[value] : '-'}
            size="small"
            variant={value === 'COMPLETED' ? 'filled' : 'outlined'}
          />
        ),
      },
      {
        colId: 'paymentStatus',
        headerName: 'Estado de pago',
        flex: 0.9,
        hide: narrow,
        minWidth: 126,
        cellRenderer: ({ data }: ICellRendererParams<SaleSummary>) => {
          if (!data) {
            return '-'
          }
          if (data.saleType === 'CASH') {
            return <Chip color="success" label="Pagada" size="small" />
          }
          return data.receivable ? <ReceivableStatusChip status={data.receivable.status} /> : null
        },
      },
      {
        colId: 'actions',
        headerName: '',
        flex: 0.8,
        maxWidth: 132,
        minWidth: 118,
        sortable: false,
        cellRenderer: ({ data }: ICellRendererParams<SaleSummary>) =>
          data ? (
            <Button
              onClick={() => onViewDetails(data.id)}
              size="small"
              startIcon={<VisibilityRoundedIcon />}
            >
              Ver detalle
            </Button>
          ) : null,
      },
    ],
    [compact, narrow, onViewDetails],
  )

  return (
    <Box className="ag-theme-balham pos-data-grid" sx={{ height: 500, width: '100%' }}>
      <AgGridReact<SaleSummary>
        animateRows
        columnDefs={columnDefs}
        defaultColDef={{
          filter: false,
          resizable: true,
          sortable: false,
          suppressSizeToFit: false,
        }}
        getRowId={({ data }) => data.id.toString()}
        loading={loading}
        noRowsOverlayComponent={() => (
          <Typography color="text.secondary" variant="body2">
            No hay ventas para mostrar.
          </Typography>
        )}
        rowData={sales}
        rowHeight={46}
        theme="legacy"
      />
    </Box>
  )
}
