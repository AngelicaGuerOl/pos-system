import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Alert, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataGridShell } from '../../../../../shared/ui/components/DataGridShell'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import { ROUTE_PATHS } from '../../../../../shared/routes/routePaths'
import { formatDate } from '../../../../../shared/utils/formatters'
import { useSuppliers } from '../../../../catalog/suppliers/ui/hooks/useSuppliers'
import { useSupplierInventoryBaseline } from '../../../../catalog/suppliers/ui/hooks/useSupplierInventoryBaseline'
import { useCreateSupplierSettlement } from '../hooks/useCreateSupplierSettlement'
import { useSupplierSettlements } from '../hooks/useSupplierSettlements'

const nextDate = (value: string): string => {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}

export const CreateSupplierSettlementPage = () => {
  const navigate = useNavigate()
  const suppliersState = useSuppliers({ active: true, size: 50 })
  const createSettlement = useCreateSupplierSettlement()
  const [supplierId, setSupplierId] = useState(0)
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10))
  const baselineState = useSupplierInventoryBaseline(supplierId || undefined)
  const previousSettlements = useSupplierSettlements({
    page: 0,
    size: 1,
    sort: 'periodEnd,desc',
    status: 'FINALIZED',
    supplierId: supplierId || null,
  })
  const lastSettlement = previousSettlements.settlements[0] ?? null
  const periodStart = useMemo(() => {
    if (lastSettlement) return nextDate(lastSettlement.periodEnd)
    if (baselineState.baseline) return nextDate(baselineState.baseline.baselineDate)
    return null
  }, [baselineState.baseline, lastSettlement])

  const handleSubmit = async () => {
    if (!supplierId) return
    const created = await createSettlement.createSettlement({ periodEnd, supplierId })
    if (created) {
      navigate(ROUTE_PATHS.supplierSettlementEdit.replace(':settlementId', String(created.id)))
    }
  }

  return (
    <Stack spacing={3}>
      <PageHeader subtitle="Selecciona el proveedor y la fecha en la que realizaras el conteo." title="Iniciar corte por proveedor" />
      <DataGridShell loading={createSettlement.loading || suppliersState.loading}>
        <Stack spacing={2}>
          {createSettlement.error ? (
            <Alert severity="error">
              {createSettlement.error.message}
              {createSettlement.error.status === 409 ? ' Puedes revisar el historial para continuar un borrador existente o configurar inventario inicial si falta.' : ''}
            </Alert>
          ) : null}
          <FormControl fullWidth>
            <InputLabel>Proveedor</InputLabel>
            <Select label="Proveedor" onChange={(event) => setSupplierId(Number(event.target.value))} value={supplierId}>
              <MenuItem value={0}>Selecciona proveedor</MenuItem>
              {suppliersState.suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Fecha del conteo"
            onChange={(event) => setPeriodEnd(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            type="date"
            value={periodEnd}
          />
          {supplierId && periodStart ? (
            <Stack spacing={0.5}>
              <Typography color="text.secondary">
                Ultimo corte: {lastSettlement ? formatDate(lastSettlement.periodEnd) : 'Sin cortes previos'}
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                Periodo del nuevo corte: {formatDate(periodStart)} al {formatDate(periodEnd)}
              </Typography>
            </Stack>
          ) : null}
          <Alert severity="info">Inventario inicial + mercancia recibida - inventario final = importe por justificar.</Alert>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button onClick={() => navigate(ROUTE_PATHS.supplierSettlements)}>Historial de cortes</Button>
            <Button disabled={!supplierId || createSettlement.loading} onClick={handleSubmit} startIcon={<AddRoundedIcon />} variant="contained">
              Iniciar corte
            </Button>
          </Stack>
        </Stack>
      </DataGridShell>
    </Stack>
  )
}
