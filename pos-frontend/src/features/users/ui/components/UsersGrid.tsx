import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'
import { StatusChip } from '../../../../shared/ui/components/StatusChip'
import { formatDateTime } from '../../../../shared/utils/formatters'
import { USER_ROLE_LABELS, type User } from '../../domain/entities/User'

ModuleRegistry.registerModules([AllCommunityModule])

type UsersGridProps = {
  canManage: boolean
  loading: boolean
  onDeactivate: (user: User) => void
  onEdit: (user: User) => void
  users: User[]
}

export const UsersGrid = ({
  canManage,
  loading,
  onDeactivate,
  onEdit,
  users,
}: UsersGridProps) => {
  const columnDefs = useMemo<ColDef<User>[]>(
    () => [
      { field: 'id', headerName: 'ID', maxWidth: 90 },
      {
        field: 'username',
        flex: 1,
        headerName: 'Usuario',
        minWidth: 220,
        cellRenderer: ({ value }: { value?: string }) => (
          <Tooltip arrow title={value || ''}>
            <Typography noWrap sx={{ fontSize: 'inherit', fontWeight: 700 }}>
              {value}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: 'role',
        headerName: 'Rol',
        minWidth: 160,
        cellRenderer: ({ data }: { data?: User }) =>
          data ? <Chip label={USER_ROLE_LABELS[data.role]} size="small" variant="outlined" /> : null,
      },
      {
        field: 'mustChangePassword',
        headerName: 'Contrasena',
        minWidth: 170,
        cellRenderer: ({ data }: { data?: User }) =>
          data ? (
            <Chip
              color={data.mustChangePassword ? 'warning' : 'success'}
              label={data.mustChangePassword ? 'Cambio pendiente' : 'Actualizada'}
              size="small"
              variant={data.mustChangePassword ? 'filled' : 'outlined'}
            />
          ) : null,
      },
      {
        field: 'createdAt',
        headerName: 'Fecha de registro',
        minWidth: 190,
        valueFormatter: ({ value }) => formatDateTime(value as string | null | undefined),
      },
      {
        field: 'active',
        headerName: 'Estado',
        maxWidth: 130,
        cellRenderer: ({ data }: { data?: User }) =>
          data ? <StatusChip active={data.active} /> : null,
      },
      {
        colId: 'actions',
        headerName: 'Acciones',
        width: 130,
        sortable: false,
        filter: false,
        cellRenderer: ({ data }: { data?: User }) => {
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
      <AgGridReact<User>
        animateRows
        columnDefs={columnDefs}
        defaultColDef={{ filter: false, resizable: true, sortable: true }}
        getRowId={({ data }) => data.id.toString()}
        loading={loading}
        noRowsOverlayComponent={() => (
          <Typography color="text.secondary" variant="body2">
            No hay usuarios para mostrar.
          </Typography>
        )}
        rowData={users}
        theme="legacy"
      />
    </Box>
  )
}
