import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { Box, Button, Chip, Typography } from '@mui/material'
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

ModuleRegistry.registerModules([AllCommunityModule])

type SalesHistoryGridProps = {
  loading: boolean
  onViewDetails: (saleId: number) => void
  sales: SaleSummary[]
}

export const SalesHistoryGrid = ({ loading, onViewDetails, sales }: SalesHistoryGridProps) => {
  const columnDefs = useMemo<ColDef<SaleSummary>[]>(
    () => [
      {
        field: 'id',
        headerName: 'Folio',
        maxWidth: 110,
        minWidth: 100,
        valueFormatter: ({ value }) => `#${value}`,
      },
      {
        field: 'createdAt',
        headerName: 'Fecha y hora',
        minWidth: 190,
        valueFormatter: ({ value }) => formatDateTime(value as string | null | undefined),
      },
      {
        field: 'createdByUsername',
        headerName: 'Cajero',
        minWidth: 150,
      },
      {
        field: 'customerFullName',
        flex: 1,
        headerName: 'Cliente',
        minWidth: 210,
        cellRenderer: ({ value }: ICellRendererParams<SaleSummary, string>) => (
          <Typography noWrap sx={{ fontSize: 'inherit' }}>
            {value || 'Público general'}
          </Typography>
        ),
      },
      {
        field: 'saleType',
        headerName: 'Tipo',
        minWidth: 130,
        valueFormatter: ({ value }) => SALE_TYPE_LABELS[value as SaleSummary['saleType']] ?? value,
      },
      {
        field: 'total',
        headerName: 'Total',
        minWidth: 140,
        valueFormatter: ({ value }) => formatCurrency(Number(value)),
      },
      {
        field: 'status',
        headerName: 'Estado',
        minWidth: 140,
        cellRenderer: ({ value }: ICellRendererParams<SaleSummary, SaleStatus>) => (
          <Chip
            color={value === 'COMPLETED' ? 'success' : 'default'}
            label={value ? SALE_STATUS_LABELS[value] : '-'}
            size="small"
            variant={value === 'COMPLETED' ? 'filled' : 'outlined'}
          />
        ),
      },
      {
        colId: 'actions',
        headerName: '',
        maxWidth: 150,
        minWidth: 140,
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
    [onViewDetails],
  )

  return (
    <Box className="ag-theme-balham pos-data-grid" sx={{ height: 500, width: '100%' }}>
      <AgGridReact<SaleSummary>
        animateRows
        columnDefs={columnDefs}
        defaultColDef={{ filter: false, resizable: true, sortable: false }}
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
