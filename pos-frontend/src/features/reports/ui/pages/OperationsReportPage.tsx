import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { PageHeader } from '../../../../shared/ui/components/PageHeader'
import { formatCurrency, formatDate, formatNumber } from '../../../../shared/utils/formatters'
import { userDependencies } from '../../../users/dependencies'
import type { User } from '../../../users/domain/entities/User'
import type { OperationsReport } from '../../domain/entities/OperationsReport'
import { useOperationsReport } from '../hooks/useOperationsReport'

const todayInputValue = () => new Date().toISOString().slice(0, 10)

type AmountRowProps = {
  label: string
  value: number
  strong?: boolean
}

const AmountRow = ({ label, strong = false, value }: AmountRowProps) => (
  <Stack
    direction="row"
    spacing={1}
    sx={{
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: 0,
    }}
  >
    <Typography color={strong ? 'text.primary' : 'text.secondary'} variant="body2">
      {label}
    </Typography>
    <Typography
      sx={{ flexShrink: 0, fontWeight: strong ? 800 : 600, whiteSpace: 'nowrap' }}
      variant="body2"
    >
      {formatCurrency(value)}
    </Typography>
  </Stack>
)

type TextRowProps = {
  label: string
  value: string
}

const TextRow = ({ label, value }: TextRowProps) => (
  <Stack
    direction="row"
    spacing={1}
    sx={{
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: 0,
    }}
  >
    <Typography color="text.secondary" variant="body2">
      {label}
    </Typography>
    <Typography sx={{ flexShrink: 0, fontWeight: 600, whiteSpace: 'nowrap' }} variant="body2">
      {value}
    </Typography>
  </Stack>
)

type ReportSectionProps = {
  title: string
  children: ReactNode
}

const ReportSection = ({ children, title }: ReportSectionProps) => (
  <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
    <CardContent sx={{ px: 1.75, py: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Stack spacing={1.1}>
        <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
          {title}
        </Typography>
        {children}
      </Stack>
    </CardContent>
  </Card>
)

const formatPeriodLabel = (from: string, to: string): string => {
  if (from === to) {
    return `Resultados del ${formatDate(from)}`
  }

  return `Resultados del ${formatDate(from)} al ${formatDate(to)}`
}

const getNetCashFlowSx = (value: number) => {
  if (value > 0) {
    return {
      bgcolor: 'success.light',
      color: 'success.contrastText',
    }
  }

  if (value < 0) {
    return {
      bgcolor: 'error.light',
      color: 'error.contrastText',
    }
  }

  return {
    bgcolor: 'action.hover',
    color: 'text.primary',
  }
}

const OperationsReportContent = ({ report }: { report: OperationsReport }) => (
  <Stack spacing={1.25}>
    <Typography color="text.secondary" variant="body2">
      {formatPeriodLabel(report.period.from, report.period.to)}
      {report.period.cashierUsername ? ` · Cajero: ${report.period.cashierUsername}` : ''}
    </Typography>

    <Grid container spacing={1.25}>
      <Grid size={{ xs: 12, lg: 6 }}>
        <ReportSection title="Resumen de ventas">
          <Stack spacing={0.65}>
            <AmountRow label="Ventas en efectivo" value={report.sales.cashSalesAmount} />
            <AmountRow label="Ventas fiadas" value={report.sales.creditSalesAmount} />
            <AmountRow label="Total vendido" strong value={report.sales.grossSalesAmount} />
            <Divider />
            <AmountRow label="Devoluciones" value={report.sales.returnedAmount} />
            <AmountRow label="Cancelaciones" value={report.sales.cancelledSalesAmount} />
            <TextRow label="Número de ventas" value={formatNumber(report.sales.salesCount)} />
          </Stack>
        </ReportSection>
      </Grid>

      <Grid size={{ xs: 12, lg: 6 }}>
        <ReportSection title="Cuentas por cobrar">
          <Stack spacing={0.65}>
            <AmountRow label="Deuda generada" value={report.receivables.creditGeneratedAmount} />
            <AmountRow label="Abonos recibidos" value={report.receivables.receivablePaymentsAmount} />
            <AmountRow
              label="Saldo pendiente"
              strong
              value={report.receivables.outstandingGeneratedAmount}
            />
          </Stack>
        </ReportSection>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <ReportSection title="Movimientos de efectivo">
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={0.65}>
                <Typography sx={{ fontWeight: 700 }} variant="body2">Entradas</Typography>
                <AmountRow label="Ventas cobradas en efectivo" value={report.cash.cashSalesAmount} />
                <AmountRow label="Abonos recibidos" value={report.cash.receivablePaymentsAmount} />
                <AmountRow label="Entradas manuales" value={report.cash.manualInflowsAmount} />
                <AmountRow label="Total de entradas" strong value={report.cash.totalInflows} />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={0.65}>
                <Typography sx={{ fontWeight: 700 }} variant="body2">Salidas</Typography>
                <AmountRow label="Salidas manuales" value={report.cash.manualOutflowsAmount} />
                <AmountRow label="Reembolsos por devoluciones" value={report.cash.returnRefundsAmount} />
                <AmountRow
                  label="Reembolsos por cancelaciones"
                  value={report.cash.cancellationRefundsAmount}
                />
                <AmountRow label="Total de salidas" strong value={report.cash.totalOutflows} />
              </Stack>
            </Grid>
          </Grid>
          <Divider />
          <Box sx={{ borderRadius: 1, px: 1.25, py: 1, ...getNetCashFlowSx(report.cash.netCashFlow) }}>
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 800 }} variant="body2">
                Efectivo resultante del periodo
              </Typography>
              <Typography sx={{ fontWeight: 900, whiteSpace: 'nowrap' }} variant="body2">
                {formatCurrency(report.cash.netCashFlow)}
              </Typography>
            </Stack>
            <Typography sx={{ opacity: 0.85, mt: 0.25 }} variant="caption">
              Entradas de efectivo menos salidas de efectivo.
            </Typography>
          </Box>
        </ReportSection>
      </Grid>
    </Grid>
  </Stack>
)

export const OperationsReportPage = () => {
  const initialDate = useMemo(() => todayInputValue(), [])
  const [from, setFrom] = useState(initialDate)
  const [to, setTo] = useState(initialDate)
  const [cashierId, setCashierId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [cashiers, setCashiers] = useState<User[]>([])
  const [cashiersLoading, setCashiersLoading] = useState(false)
  const { error, fetchReport, loading, report, reset } = useOperationsReport()

  useEffect(() => {
    let mounted = true

    const loadCashiers = async () => {
      setCashiersLoading(true)

      try {
        const page = await userDependencies.getUsersUseCase.execute({
          page: 0,
          size: 50,
          sort: 'username,asc',
        })

        if (mounted) {
          setCashiers(page.content)
        }
      } catch {
        if (mounted) {
          setCashiers([])
        }
      } finally {
        if (mounted) {
          setCashiersLoading(false)
        }
      }
    }

    void loadCashiers()

    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = () => {
    setFormError(null)

    if (!from || !to) {
      setFormError('Fecha inicial y fecha final son obligatorias.')
      return
    }

    if (from > to) {
      setFormError('La fecha inicial no puede ser posterior a la fecha final.')
      return
    }

    void fetchReport({
      from,
      to,
      cashierId: cashierId ? Number(cashierId) : undefined,
    })
  }

  const handleClear = () => {
    setFrom(initialDate)
    setTo(initialDate)
    setCashierId('')
    setFormError(null)
    reset()
  }

  return (
    <Stack spacing={1.5}>
      <PageHeader
        subtitle="Consulta las ventas y los movimientos registrados durante un periodo."
        title="Reporte de operaciones"
      />

      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <CardContent sx={{ px: 1.75, py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack spacing={1.25}>
            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Fecha inicial"
                  onChange={(event) => setFrom(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  type="date"
                  value={from}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Fecha final"
                  onChange={(event) => setTo(event.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  type="date"
                  value={to}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel id="cashier-filter-label">Cajero</InputLabel>
                  <Select
                    disabled={cashiersLoading}
                    label="Cajero"
                    labelId="cashier-filter-label"
                    onChange={(event) => setCashierId(event.target.value)}
                    value={cashierId}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {cashiers.map((cashier) => (
                      <MenuItem key={cashier.id} value={String(cashier.id)}>
                        {cashier.username}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row', md: 'column', lg: 'row' }}
                  spacing={0.75}
                  sx={{ height: '100%' }}
                >
                  <Button
                    disabled={loading}
                    fullWidth
                    onClick={handleSubmit}
                    startIcon={loading ? <CircularProgress size={18} /> : <SearchRoundedIcon />}
                    variant="contained"
                  >
                    Consultar
                  </Button>
                  <Button
                    disabled={loading}
                    fullWidth
                    onClick={handleClear}
                    variant="text"
                  >
                    Limpiar
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            {formError ? <Alert severity="warning">{formError}</Alert> : null}
            {error ? <Alert severity="error">{error.message}</Alert> : null}
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <CardContent>
            <Stack spacing={1.5} sx={{ alignItems: 'center', py: 2 }}>
              <CircularProgress />
              <Typography color="text.secondary">Consultando reporte...</Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : report ? (
        <OperationsReportContent report={report} />
      ) : (
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <CardContent>
            <Stack spacing={1.5} sx={{ alignItems: 'center', py: 2.5, textAlign: 'center' }}>
              <AssessmentRoundedIcon color="disabled" fontSize="large" />
              <Typography color="text.secondary">
                Selecciona un periodo y presiona Consultar.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  )
}
