import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import { Box, Button, Chip, Typography, useMediaQuery, useTheme } from '@mui/material'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'
import { formatCurrency, formatDateTime } from '../../../../../shared/utils/formatters'
import {
  CASH_SESSION_STATUS_LABELS,
  type CashSession,
  type CashSessionStatus,
} from '../../domain/entities/CashSession'

ModuleRegistry.registerModules([AllCommunityModule])

type CashSessionsHistoryGridProps = {
  loading: boolean
  onViewClosingSummary: (sessionId: number) => void
  sessions: CashSession[]
}

export const CashSessionsHistoryGrid = ({
  loading,
  onViewClosingSummary,
  sessions,
}: CashSessionsHistoryGridProps) => {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('lg'))

  const columnDefs = useMemo<ColDef<CashSession>[]>(
    () => [
      {
        field: 'id',
        headerName: 'Sesion',
        flex: 0.6,
        maxWidth: 96,
        minWidth: 84,
        valueFormatter: ({ value }) => `#${value}`,
      },
      {
        field: 'openedAt',
        headerName: 'Apertura',
        flex: 1,
        minWidth: 135,
        valueFormatter: ({ value }) => formatDateTime(value as string | null | undefined),
      },
      {
        field: 'closedAt',
        headerName: 'Cierre',
        flex: 1,
        hide: compact,
        minWidth: 135,
        valueFormatter: ({ value }) => formatDateTime(value as string | null | undefined),
      },
      {
        field: 'openedByUsername',
        headerName: 'Abierta por',
        flex: 0.85,
        minWidth: 120,
      },
      {
        field: 'closedByUsername',
        headerName: 'Cerrada por',
        flex: 0.85,
        hide: compact,
        minWidth: 120,
        valueFormatter: ({ value }) => value || '-',
      },
      {
        field: 'openingAmount',
        headerName: 'Fondo inicial',
        flex: 0.8,
        minWidth: 115,
        valueFormatter: ({ value }) => formatCurrency(Number(value ?? 0)),
      },
      {
        field: 'status',
        headerName: 'Estado',
        flex: 0.75,
        minWidth: 105,
        cellRenderer: ({ value }: ICellRendererParams<CashSession, CashSessionStatus>) => (
          <Chip
            color={value === 'OPEN' ? 'success' : 'default'}
            label={value ? CASH_SESSION_STATUS_LABELS[value] : '-'}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        colId: 'actions',
        headerName: '',
        flex: 0.85,
        maxWidth: 132,
        minWidth: 118,
        sortable: false,
        cellRenderer: ({ data }: ICellRendererParams<CashSession>) =>
          data && data.status === 'CLOSED' ? (
            <Button
              onClick={() => onViewClosingSummary(data.id)}
              size="small"
              startIcon={<ReceiptLongRoundedIcon />}
            >
              Ver corte
            </Button>
          ) : null,
      },
    ],
    [compact, onViewClosingSummary],
  )

  return (
    <Box className="ag-theme-balham pos-data-grid" sx={{ height: 500, width: '100%' }}>
      <AgGridReact<CashSession>
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
            No hay sesiones para mostrar.
          </Typography>
        )}
        rowData={sessions}
        rowHeight={46}
        theme="legacy"
      />
    </Box>
  )
}
