import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded'
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'
import { StatusChip } from '../../../../../shared/ui/components/StatusChip'
import type { Supplier } from '../../domain/entities/Supplier'

ModuleRegistry.registerModules([AllCommunityModule])

type SuppliersGridProps = {
  suppliers: Supplier[]
  loading: boolean
  onDeactivate: (supplier: Supplier) => void
  onEdit: (supplier: Supplier) => void
  onInventoryBaseline: (supplier: Supplier) => void
  onProducts: (supplier: Supplier) => void
}

export const SuppliersGrid = ({
  suppliers,
  loading,
  onDeactivate,
  onEdit,
  onInventoryBaseline,
  onProducts,
}: SuppliersGridProps) => {
  const columnDefs = useMemo<ColDef<Supplier>[]>(
    () => [
      {
        field: 'name',
        flex: 1,
        headerName: 'Nombre',
        minWidth: 200,
        cellRenderer: ({ value }: { value?: string }) => (
          <Typography noWrap sx={{ fontSize: 'inherit', fontWeight: 700 }}>
            {value}
          </Typography>
        ),
      },
      { field: 'contactName', headerName: 'Contacto', minWidth: 180 },
      { field: 'phone', headerName: 'Telefono', minWidth: 140 },
      { field: 'email', headerName: 'Correo', minWidth: 200 },
      {
        field: 'active',
        headerName: 'Estado',
        width: 130,
        cellRenderer: ({ data }: { data?: Supplier }) => data ? <StatusChip active={data.active} /> : null,
      },
      {
        colId: 'actions',
        headerName: 'Acciones',
        minWidth: 190,
        sortable: false,
        cellRenderer: ({ data }: { data?: Supplier }) => {
          if (!data) {
            return null
          }
          return (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Editar">
                <IconButton aria-label="Editar proveedor" color="primary" onClick={() => onEdit(data)} size="small">
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Ver productos">
                <IconButton aria-label="Ver productos" onClick={() => onProducts(data)} size="small">
                  <ListAltRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Inventario inicial">
                <IconButton aria-label="Inventario inicial" onClick={() => onInventoryBaseline(data)} size="small">
                  <InventoryRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Desactivar">
                <span>
                  <IconButton
                    aria-label="Desactivar proveedor"
                    color="error"
                    disabled={!data.active}
                    onClick={() => onDeactivate(data)}
                    size="small"
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
    [onDeactivate, onEdit, onInventoryBaseline, onProducts],
  )

  return (
    <Box className="ag-theme-balham pos-data-grid" sx={{ height: 430, width: '100%' }}>
      <AgGridReact<Supplier>
        animateRows
        columnDefs={columnDefs}
        defaultColDef={{ filter: false, resizable: true, sortable: true }}
        getRowId={({ data }) => data.id.toString()}
        loading={loading}
        rowData={suppliers}
        theme="legacy"
      />
    </Box>
  )
}
