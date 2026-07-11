import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useMemo } from 'react'
import type { Category } from '../../domain/entities/Category'

ModuleRegistry.registerModules([AllCommunityModule])

type CategoriesGridProps = {
  categories: Category[]
  canManage: boolean
  loading: boolean
  onEdit: (category: Category) => void
  onDeactivate: (category: Category) => void
}

export const CategoriesGrid = ({
  categories,
  canManage,
  loading,
  onEdit,
  onDeactivate,
}: CategoriesGridProps) => {
  const columnDefs = useMemo<ColDef<Category>[]>(
    () => [
      { field: 'id', flex: 0.2, headerName: 'ID', minWidth: 10 },
      {
        field: 'name',
        flex: 1,
        headerName: 'Nombre',
        minWidth: 120,
      },
      {
        field: 'description',
        flex: 1.5,
        headerName: 'Descripción',
        minWidth: 180,
        cellRenderer: ({ value }: { value?: string | null }) => (
          <Tooltip arrow title={value || ''}>
            <span
              style={{
                display: 'inline-block',
                maxWidth: 580,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {value || '-'}
            </span>
          </Tooltip>
        ),
      },
      {
        colId: 'actions',
        headerName: 'Acciones',
        width: 120,
        sortable: false,
        filter: false,
        cellRenderer: ({ data }: { data?: Category }) => {
          if (!data || !canManage) {
            return null
          }

          return (
            <Stack direction="row" spacing={1}>
              <Tooltip title="Editar">
                <IconButton
                  color="primary"
                  onClick={() => onEdit(data)}
                  size="small"
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
                  >
                    <DeleteRoundedIcon fontSize="small" />
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
    <Box className="ag-theme-balham pos-data-grid categories-expediente-grid" sx={{ height: 350, width: '100%' }}>
      <AgGridReact<Category>
        animateRows
        columnDefs={columnDefs}
        defaultColDef={{ filter: false, resizable: true, sortable: true }}
        getRowId={({ data }) => data.id.toString()}
        theme="legacy"
        loading={loading}
        noRowsOverlayComponent={() => (
          <Typography color="text.secondary" variant="body2">
            No hay categorias para mostrar.
          </Typography>
        )}
        rowData={categories}
      />
    </Box>
  )
}
