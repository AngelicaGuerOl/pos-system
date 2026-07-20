import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'
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
  onReactivate: (product: Product) => void
}

export const ProductsGrid = ({
  canManage,
  loading,
  products,
  onEdit,
  onDeactivate,
  onReactivate,
}: ProductsGridProps) => {
  const columnDefs = useMemo<ColDef<Product>[]>(
    () => [
      { field: 'id', flex: 0.35, headerName: 'ID', minWidth: 52 },
      {
        field: 'barcode',
        flex: 1,
        headerName: 'Codigo de barras',
        minWidth: 150,
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
        flex: 1.2,
        headerName: 'Nombre',
        minWidth: 100,
        cellRenderer: ({ value }: { value?: string }) => (
          <Tooltip arrow title={value || ''}>
            <Typography noWrap sx={{ fontSize: 'inherit', fontWeight: 700 }}>
              {value}
            </Typography>
          </Tooltip>
        ),
      },
      { field: 'categoryName', flex: 0.8, headerName: 'Categoria', minWidth: 100 },
      { field: 'supplierName', flex: 0.9, headerName: 'Proveedor', minWidth: 112, valueFormatter: ({ value }) => value ? String(value) : 'Sin proveedor' },
      {
        field: 'unit',
        flex: 0.55,
        headerName: 'Unidad',
        minWidth: 82,
        valueFormatter: ({ value }) => PRODUCT_UNIT_LABELS[value as Product['unit']],
      },
      {
        field: 'costPrice',
        flex: 0.85,
        headerName: 'Precio costo',
        minWidth: 116,
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
        flex: 0.85,
        headerName: 'Precio venta',
        minWidth: 116,
        valueFormatter: ({ value }) => formatCurrency(Number(value)),
      },
      {
        field: 'currentStock',
        flex: 0.75,
        headerName: 'Stock actual',
        minWidth: 104,
        valueFormatter: ({ value }) => formatNumber(Number(value)),
      },
      {
        field: 'minimumStock',
        flex: 0.80,
        headerName: 'Stock minimo',
        minWidth: 104,
        valueFormatter: ({ value }) => formatNumber(Number(value)),
      },
      {
        colId: 'actions',
        flex: 0.65,
        headerName: 'Acciones',
        minWidth: 96,
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
                  aria-label="Editar producto"
                  color="primary"
                  onClick={() => onEdit(data)}
                  size="small"
                  sx={{ bgcolor: 'primary.50' }}
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {data.active ? (
                <Tooltip title="Desactivar producto sin eliminar su historial">
                  <IconButton
                    aria-label="Desactivar producto"
                    color="error"
                    onClick={() => onDeactivate(data)}
                    size="small"
                    sx={{ bgcolor: 'error.50' }}
                  >
                    <BlockRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Reactivar producto">
                  <IconButton
                    aria-label="Reactivar producto"
                    color="success"
                    onClick={() => onReactivate(data)}
                    size="small"
                    sx={{ bgcolor: 'success.50' }}
                  >
                    <CheckCircleRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          )
        },
      },
    ],
    [canManage, onDeactivate, onEdit, onReactivate],
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
