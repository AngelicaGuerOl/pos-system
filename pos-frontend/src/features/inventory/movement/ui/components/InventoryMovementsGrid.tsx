import { Box, Chip, Tooltip, Typography } from '@mui/material'
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'
import { formatDateTime, formatNumber } from '../../../../../shared/utils/formatters'
import {
  INVENTORY_MOVEMENT_DIRECTION_LABELS,
  INVENTORY_MOVEMENT_TYPE_LABELS,
  type InventoryMovement,
} from '../../domain/entities/InventoryMovement'

ModuleRegistry.registerModules([AllCommunityModule])

type InventoryMovementsGridProps = {
  loading: boolean
  movements: InventoryMovement[]
}

export const InventoryMovementsGrid = ({ loading, movements }: InventoryMovementsGridProps) => {
  const columnDefs = useMemo<ColDef<InventoryMovement>[]>(
    () => [
      {
        field: 'createdAt',
        headerName: 'Fecha y hora',
        minWidth: 190,
        valueFormatter: ({ value }) => formatDateTime(value as string | null | undefined),
      },
      {
        field: 'productName',
        flex: 1,
        headerName: 'Producto',
        minWidth: 220,
        cellRenderer: ({ value }: { value?: string }) => (
          <Tooltip arrow title={value || ''}>
            <Typography noWrap sx={{ fontSize: 'inherit', fontWeight: 800 }}>
              {value}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: 'productBarcode',
        headerName: 'Codigo de barras',
        minWidth: 170,
        cellRenderer: ({ value }: { value?: string }) => (
          <Typography
            sx={{
              bgcolor: 'grey.100',
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: 'inherit',
              px: 1,
              py: 0.25,
            }}
          >
            {value}
          </Typography>
        ),
      },
      {
        field: 'type',
        headerName: 'Tipo',
        minWidth: 170,
        valueFormatter: ({ value }) =>
          INVENTORY_MOVEMENT_TYPE_LABELS[value as InventoryMovement['type']] ?? value,
      },
      {
        field: 'direction',
        headerName: 'Dirección',
        maxWidth: 140,
        cellRenderer: ({ data }: { data?: InventoryMovement }) =>
          data ? (
            <Chip
              color={data.direction === 'IN' ? 'success' : 'error'}
              label={INVENTORY_MOVEMENT_DIRECTION_LABELS[data.direction]}
              size="small"
              variant="outlined"
            />
          ) : null,
      },
      {
        field: 'quantity',
        headerName: 'Cantidad',
        minWidth: 130,
        valueFormatter: ({ value }) => formatNumber(Number(value)),
      },
      {
        field: 'previousStock',
        headerName: 'Stock anterior',
        minWidth: 150,
        valueFormatter: ({ value }) => formatNumber(Number(value)),
      },
      {
        field: 'newStock',
        headerName: 'Stock posterior',
        minWidth: 150,
        valueFormatter: ({ value }) => formatNumber(Number(value)),
      },
      {
        field: 'createdByUsername',
        headerName: 'Usuario',
        minWidth: 160,
      },
      {
        field: 'description',
        flex: 1,
        headerName: 'Descripción',
        minWidth: 260,
        cellRenderer: ({ value }: { value?: string }) => (
          <Tooltip arrow title={value || ''}>
            <Typography noWrap sx={{ fontSize: 'inherit' }}>
              {value}
            </Typography>
          </Tooltip>
        ),
      },
    ],
    [],
  )

  return (
    <Box className="ag-theme-balham pos-data-grid" sx={{ height: 460, width: '100%' }}>
      <AgGridReact<InventoryMovement>
        animateRows
        columnDefs={columnDefs}
        defaultColDef={{ filter: false, resizable: true, sortable: true }}
        getRowId={({ data }) => data.id.toString()}
        loading={loading}
        noRowsOverlayComponent={() => (
          <Typography color="text.secondary" variant="body2">
            No hay movimientos de inventario para mostrar.
          </Typography>
        )}
        rowData={movements}
        theme="legacy"
      />
    </Box>
  )
}
