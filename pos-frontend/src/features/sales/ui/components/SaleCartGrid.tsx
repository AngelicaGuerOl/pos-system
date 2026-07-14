import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import { Box, Chip, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ICellRendererParams,
  type ValueFormatterParams,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'
import { formatCurrency } from '../../../../shared/utils/formatters'
import type { SaleCartItem } from '../hooks/useSaleCart'

ModuleRegistry.registerModules([AllCommunityModule])

type QuantityCellProps = {
  item: SaleCartItem
  onDecrease: (productId: number) => void
  onIncrease: (productId: number) => void
  onUpdateQuantity: (productId: number, quantity: number) => void
}

const QuantityCell = ({
  item,
  onDecrease,
  onIncrease,
  onUpdateQuantity,
}: QuantityCellProps) => (
  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%' }}>
    <Tooltip title="Disminuir">
      <IconButton onClick={() => onDecrease(item.productId)} size="small" sx={{ height: 30, width: 30 }}>
        <RemoveRoundedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
    <TextField
      onBlur={(event) => onUpdateQuantity(item.productId, Number(event.target.value))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onUpdateQuantity(item.productId, Number((event.target as HTMLInputElement).value))
          event.currentTarget.blur()
        }
      }}
      slotProps={{
        htmlInput: {
          min: 0.01,
          step: '0.01',
        },
      }}
      size="small"
      sx={{
        width: 70,
        '& .MuiInputBase-input': {
          px: 1,
          py: 0.75,
          textAlign: 'center',
        },
      }}
      type="number"
      defaultValue={item.quantity}
    />
    <Tooltip title="Aumentar">
      <IconButton
        disabled={item.quantity >= item.availableStock}
        onClick={() => onIncrease(item.productId)}
        size="small"
        sx={{ height: 30, width: 30 }}
      >
        <AddRoundedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </Stack>
)

type SaleCartGridProps = {
  items: SaleCartItem[]
  height?: number | string
  onDecrease: (productId: number) => void
  onIncrease: (productId: number) => void
  onRemove: (productId: number) => void
  onUpdateQuantity: (productId: number, quantity: number) => void
}

export const SaleCartGrid = ({
  height = 460,
  items,
  onDecrease,
  onIncrease,
  onRemove,
  onUpdateQuantity,
}: SaleCartGridProps) => {
  const columnDefs = useMemo<ColDef<SaleCartItem>[]>(
    () => [
      {
        field: 'name',
        flex: 1,
        headerName: 'Producto',
        minWidth: 230,
        cellRenderer: ({ data, value }: ICellRendererParams<SaleCartItem, string>) => {
          const lowStock = data ? data.availableStock <= 3 : false
          const insufficient = data ? data.quantity >= data.availableStock : false

          return (
            <Stack spacing={0.25} sx={{ justifyContent: 'center', minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 'inherit', fontWeight: 800, lineHeight: 1.15 }}>
                {value}
              </Typography>
              {lowStock || insufficient ? (
                <Chip
                  color={insufficient ? 'warning' : 'default'}
                  label={insufficient ? 'Stock maximo' : 'Stock bajo'}
                  size="small"
                  sx={{ alignSelf: 'flex-start', height: 18, '& .MuiChip-label': { px: 0.75 } }}
                  variant="outlined"
                />
              ) : null}
            </Stack>
          )
        },
      },
      {
        colId: 'quantity',
        headerName: 'Cantidad',
        minWidth: 160,
        sortable: false,
        cellRenderer: ({ data }: ICellRendererParams<SaleCartItem>) =>
          data ? (
            <QuantityCell
              item={data}
              onDecrease={onDecrease}
              onIncrease={onIncrease}
              onUpdateQuantity={onUpdateQuantity}
            />
          ) : null,
      },
      {
        field: 'salePrice',
        headerName: 'Precio unitario',
        minWidth: 125,
        valueFormatter: ({ value }: ValueFormatterParams<SaleCartItem, number>) =>
          formatCurrency(Number(value)),
      },
      {
        field: 'lineTotal',
        headerName: 'Importe',
        minWidth: 125,
        valueFormatter: ({ value }: ValueFormatterParams<SaleCartItem, number>) =>
          formatCurrency(Number(value)),
      },
      {
        colId: 'actions',
        headerName: '',
        maxWidth: 68,
        minWidth: 58,
        sortable: false,
        cellRenderer: ({ data }: ICellRendererParams<SaleCartItem>) =>
          data ? (
            <Tooltip title="Eliminar">
              <IconButton color="error" onClick={() => onRemove(data.productId)} size="small">
                <DeleteRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null,
      },
    ],
    [onDecrease, onIncrease, onRemove, onUpdateQuantity],
  )

  return (
    <Box className="ag-theme-balham pos-data-grid" sx={{ height, width: '100%' }}>
      <AgGridReact<SaleCartItem>
        animateRows
        columnDefs={columnDefs}
        defaultColDef={{ filter: false, resizable: true, sortable: false }}
        getRowId={({ data }) => data.productId.toString()}
        headerHeight={40}
        noRowsOverlayComponent={() => (
          <Typography color="text.secondary" variant="body2">
            El carrito esta vacio.
          </Typography>
        )}
        rowHeight={46}
        rowData={items}
        theme="legacy"
      />
    </Box>
  )
}
