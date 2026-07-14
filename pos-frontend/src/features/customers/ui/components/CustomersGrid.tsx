import BlockRoundedIcon from '@mui/icons-material/BlockRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo } from 'react'
import { StatusChip } from '../../../../shared/ui/components/StatusChip'
import { formatDateTime } from '../../../../shared/utils/formatters'
import type { Customer } from '../../domain/entities/Customer'

ModuleRegistry.registerModules([AllCommunityModule])

type CustomersGridProps = {
  canCreateOrEdit: boolean
  canDeactivate: boolean
  customers: Customer[]
  loading: boolean
  onDeactivate: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onViewReceivables: (customer: Customer) => void
}

const getDisplayName = (customer: Customer): string => {
  return customer.fullName || `${customer.firstName} ${customer.lastName}`.trim()
}

export const CustomersGrid = ({
  canCreateOrEdit,
  canDeactivate,
  customers,
  loading,
  onDeactivate,
  onEdit,
  onViewReceivables,
}: CustomersGridProps) => {
  const columnDefs = useMemo<ColDef<Customer>[]>(
    () => [
      { field: 'id', headerName: 'ID', maxWidth: 90 },
      {
        colId: 'fullName',
        flex: 1,
        headerName: 'Nombre completo',
        minWidth: 240,
        valueGetter: ({ data }) => (data ? getDisplayName(data) : ''),
        cellRenderer: ({ data }: { data?: Customer }) =>
          data ? (
            <Tooltip arrow title={getDisplayName(data)}>
              <Typography noWrap sx={{ fontSize: 'inherit', fontWeight: 700 }}>
                {getDisplayName(data)}
              </Typography>
            </Tooltip>
          ) : null,
      },
      {
        field: 'phone',
        headerName: 'Telefono',
        minWidth: 170,
        valueFormatter: ({ value }) => value || '-',
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
        cellRenderer: ({ data }: { data?: Customer }) =>
          data ? <StatusChip active={data.active} /> : null,
      },
      {
        colId: 'actions',
        headerName: 'Acciones',
        width: 130,
        sortable: false,
        filter: false,
        cellRenderer: ({ data }: { data?: Customer }) => {
          if (!data || (!canCreateOrEdit && !canDeactivate)) {
            return null
          }

          return (
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              {canCreateOrEdit ? (
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
              ) : null}
              <Tooltip title="Ver cuentas por cobrar">
                <IconButton
                  color="info"
                  onClick={() => onViewReceivables(data)}
                  size="small"
                  sx={{ bgcolor: 'info.50' }}
                >
                  <RequestQuoteRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {canDeactivate ? (
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
              ) : null}
            </Stack>
          )
        },
      },
    ],
    [canCreateOrEdit, canDeactivate, onDeactivate, onEdit, onViewReceivables],
  )

  return (
    <Box className="ag-theme-balham pos-data-grid" sx={{ height: 430, width: '100%' }}>
      <AgGridReact<Customer>
        animateRows
        columnDefs={columnDefs}
        defaultColDef={{ filter: false, resizable: true, sortable: true }}
        getRowId={({ data }) => data.id.toString()}
        loading={loading}
        noRowsOverlayComponent={() => (
          <Typography color="text.secondary" variant="body2">
            No hay clientes para mostrar.
          </Typography>
        )}
        rowData={customers}
        theme="legacy"
      />
    </Box>
  )
}
