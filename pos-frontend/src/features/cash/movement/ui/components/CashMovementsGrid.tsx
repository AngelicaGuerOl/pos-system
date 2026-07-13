import { Box, Chip, Typography } from '@mui/material'
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'
import { formatCurrency, formatDateTime } from '../../../../../shared/utils/formatters'
import {
  CASH_MOVEMENT_DIRECTION_LABELS,
  CASH_MOVEMENT_TYPE_LABELS,
  type CashMovement,
} from '../../domain/entities/CashMovement'

ModuleRegistry.registerModules([AllCommunityModule])

type CashMovementsGridProps = {
  loading: boolean
  movements: CashMovement[]
}

export const CashMovementsGrid = ({ loading, movements }: CashMovementsGridProps) => {
  const columnDefs = useMemo<ColDef<CashMovement>[]>(
    () => [
      { field: 'id', headerName: 'ID', maxWidth: 90 },
      {
        field: 'createdAt',
        headerName: 'Fecha',
        minWidth: 190,
        valueFormatter: ({ value }) => formatDateTime(value as string | null | undefined),
      },
      {
        field: 'direction',
        headerName: 'Direccion',
        maxWidth: 140,
        cellRenderer: ({ data }: { data?: CashMovement }) =>
          data ? (
            <Chip
              color={data.direction === 'INFLOW' ? 'success' : 'error'}
              label={CASH_MOVEMENT_DIRECTION_LABELS[data.direction]}
              size="small"
              variant="outlined"
            />
          ) : null,
      },
      {
        field: 'type',
        headerName: 'Tipo',
        minWidth: 180,
        valueFormatter: ({ value }) =>
          CASH_MOVEMENT_TYPE_LABELS[value as CashMovement['type']] ?? value,
      },
      {
        field: 'amount',
        headerName: 'Monto',
        minWidth: 140,
        valueFormatter: ({ value }) => formatCurrency(Number(value)),
      },
      {
        field: 'description',
        flex: 1,
        headerName: 'Descripcion',
        minWidth: 260,
        cellRenderer: ({ value }: { value?: string }) => (
          <Typography noWrap sx={{ fontSize: 'inherit', fontWeight: 700 }}>
            {value}
          </Typography>
        ),
      },
      {
        field: 'createdByUsername',
        headerName: 'Usuario',
        minWidth: 160,
      },
    ],
    [],
  )

  return (
    <Box className="ag-theme-balham pos-data-grid" sx={{ height: 430, width: '100%' }}>
      <AgGridReact<CashMovement>
        animateRows
        columnDefs={columnDefs}
        defaultColDef={{ filter: false, resizable: true, sortable: true }}
        getRowId={({ data }) => data.id.toString()}
        loading={loading}
        noRowsOverlayComponent={() => (
          <Typography color="text.secondary" variant="body2">
            No hay movimientos para mostrar.
          </Typography>
        )}
        rowData={movements}
        theme="legacy"
      />
    </Box>
  )
}
