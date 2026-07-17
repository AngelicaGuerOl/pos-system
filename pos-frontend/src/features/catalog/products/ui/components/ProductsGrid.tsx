import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'
import { StatusChip } from '../../../../../shared/ui/components/StatusChip'
import {
  formatCurrency,
  formatNumber,
} from '../../../../../shared/utils/formatters'
import {
  PRODUCT_UNIT_LABELS,
  type Product,
} from '../../domain/entities/Product'

ModuleRegistry.registerModules([AllCommunityModule])

type ProductsGridProps = {
  canManage: boolean
  loading: boolean
  products: Product[]
  onEdit: (product: Product) => void
  onDeactivate: (product: Product) => void
}

export const ProductsGrid = ({
  canManage,
  loading,
  products,
  onEdit,
  onDeactivate,
}: ProductsGridProps) => {
  const columnDefs = useMemo<ColDef<Product>[]>(
    () => [
      { field: 'id', headerName: 'ID', maxWidth: 90 },
      {
        field: 'barcode',
        headerName: 'Codigo de barras',
        minWidth: 170,
        cellRenderer: ({ value }: { value?: string }) => (
          <Typography
            sx={{
              bgcolor: 'grey.100',
              borderRadius: 1,
              fontSize: 'inherit',
              fontFamily: 'monospace',
              px: 1,
              py: 0.25,
            }}
          >
            {value}
          </Typography>
        ),
      },
      {
        field: 'name',
        flex: 1,
        headerName: 'Nombre',
        minWidth: 220,
        cellRenderer: ({ value }: { value?: string }) => (
          <Tooltip arrow title={value || ''}>
            <Typography noWrap sx={{ fontSize: 'inherit', fontWeight: 700 }}>
              {value}
            </Typography>
          </Tooltip>
        ),
      },
      { field: 'categoryName', headerName: 'Categoria', minWidth: 170 },
      { field: 'supplierName', headerName: 'Proveedor', minWidth: 170, valueFormatter: ({ value }) => value ? String(value) : 'Sin proveedor' },
      {
        field: 'unit',
        headerName: 'Unidad',
        maxWidth: 130,
        valueFormatter: ({ value }) => PRODUCT_UNIT_LABELS[value as Product['unit']],
      },
      {
        field: 'costPrice',
        headerName: 'Precio costo',
        minWidth: 140,
        cellRenderer: ({ data }: { data?: Product }) => data ? (
          data.costPriceKnown ? formatCurrency(data.costPrice) : (
            <Tooltip title="No se encontraba registrado en el archivo original.">
              <span>—</span>
            </Tooltip>
          )
        ) : null,
      },
      {
        field: 'salePrice',
        headerName: 'Precio venta',
        minWidth: 140,
        valueFormatter: ({ value }) => formatCurrency(Number(value)),
      },
      {
        field: 'currentStock',
        headerName: 'Stock actual',
        minWidth: 140,
        valueFormatter: ({ value }) => formatNumber(Number(value)),
      },
      {
        field: 'minimumStock',
        headerName: 'Stock minimo',
        minWidth: 140,
        valueFormatter: ({ value }) => formatNumber(Number(value)),
      },
      {
        field: 'active',
        headerName: 'Estado',
        maxWidth: 130,
        cellRenderer: ({ data }: { data?: Product }) =>
          data ? <StatusChip active={data.active} /> : null,
      },
      {
        colId: 'actions',
        headerName: 'Acciones',
        width: 130,
        sortable: false,
        filter: false,
        cellRenderer: ({ data }: { data?: Product }) => {
          if (!data || !canManage) {
            return null
          }

          return (
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Tooltip title="Editar">
                <IconButton
                  color="primary"
                  onClick={() => onEdit(data)}
                  size="small"
                  sx={{ bgcolor: 'primary.50' }}
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Desactivar">
                <span>
                  <IconButton
                    color="error"
                    disabled={!data.active}
                    onClick={() => onDeactivate(data)}
                    size="small"
                    sx={{ bgcolor: data.active ? 'error.50' : 'transparent' }}
                  >
                    <BlockRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          )
        },
      },
    ],
    [canManage, onDeactivate, onEdit],
  )

  return (
    <Box className="ag-theme-balham pos-data-grid" sx={{ height: 430, width: '100%' }}>
      <AgGridReact<Product>
        animateRows
        columnDefs={columnDefs}
        defaultColDef={{ filter: false, resizable: true, sortable: true }}
        getRowId={({ data }) => data.id.toString()}
        theme="legacy"
        loading={loading}
        noRowsOverlayComponent={() => (
          <Typography color="text.secondary" variant="body2">
            No hay productos para mostrar.
          </Typography>
        )}
        rowData={products}
      />
    </Box>
  )
}
