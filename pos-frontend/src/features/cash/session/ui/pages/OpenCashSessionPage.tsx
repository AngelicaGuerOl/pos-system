import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../../../auth'
import { ROUTE_PATHS } from '../../../../../shared/routes/routePaths'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import { formatCurrency, formatDateTime } from '../../../../../shared/utils/formatters'
import type { CashSessionClosingSummary, OpenCashSessionData } from '../../domain/entities/CashSession'
import { CashClosingSummary } from '../components/CashClosingSummary'
import { OpenCashSessionForm } from '../components/OpenCashSessionForm'
import { useCashSession } from '../hooks/useCashSession'

const getClosingSummaryFromLocationState = (state: unknown): CashSessionClosingSummary | null => {
  if (typeof state !== 'object' || state === null || !('closingSummary' in state)) {
    return null
  }

  const candidate = (state as { closingSummary?: unknown }).closingSummary

  if (typeof candidate !== 'object' || candidate === null || !('sessionId' in candidate)) {
    return null
  }

  return candidate as CashSessionClosingSummary
}

export const OpenCashSessionPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { currentSession, error, loading, openCashSession } = useCashSession()
  const closingSummary = getClosingSummaryFromLocationState(location.state)

  const handleOpen = async (values: OpenCashSessionData) => {
    const session = await openCashSession(values)

    if (session) {
      const fromPath = typeof location.state === 'object'
        && location.state !== null
        && 'from' in location.state
        && typeof location.state.from === 'object'
        && location.state.from !== null
        && 'pathname' in location.state.from
        && typeof location.state.from.pathname === 'string'
        ? location.state.from.pathname
        : ROUTE_PATHS.cashMovements

      navigate(fromPath, { replace: true })
    }
  }

  if (currentSession) {
    return (
      <Stack spacing={3}>
        <PageHeader
          subtitle="Ya tienes una sesion de caja abierta para operar."
          title="Caja abierta"
        />

        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <CardContent>
            <Stack spacing={3}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      alignItems: 'center',
                      bgcolor: 'success.light',
                      borderRadius: 1,
                      color: 'success.contrastText',
                      display: 'flex',
                      height: 44,
                      justifyContent: 'center',
                      width: 44,
                    }}
                  >
                    <PointOfSaleRoundedIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>Sesion #{currentSession.id}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      Abierta por {currentSession.openedByUsername}
                    </Typography>
                  </Box>
                </Stack>

                <Chip color="success" label="OPEN" variant="outlined" />
              </Stack>

              <Divider />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography color="text.secondary" variant="caption">
                    Efectivo inicial
                  </Typography>
                  <Typography sx={{ fontWeight: 800 }} variant="h5">
                    {formatCurrency(currentSession.openingAmount)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography color="text.secondary" variant="caption">
                    Fecha de apertura
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {formatDateTime(currentSession.openedAt)}
                  </Typography>
                </Grid>
              </Grid>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  onClick={() => navigate(ROUTE_PATHS.cashMovements)}
                  startIcon={<ReceiptLongRoundedIcon />}
                  variant="contained"
                >
                  Ir a movimientos
                </Button>
                <Button onClick={() => navigate(ROUTE_PATHS.dashboard)}>Ir al dashboard</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    )
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle={
          user?.role === 'CASHIER'
            ? 'Abre tu caja para continuar con las operaciones del punto de venta.'
            : 'Registra el efectivo inicial de tu turno de caja.'
        }
        title="Abrir caja"
      />

      <Grid container spacing={3}>
        {closingSummary ? (
          <Grid size={{ xs: 12 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Caja cerrada correctamente. No se podrán registrar nuevas operaciones hasta abrir otra caja.
            </Alert>
            <CashClosingSummary summary={closingSummary} />
          </Grid>
        ) : null}

        <Grid size={{ xs: 12, md: 7, lg: 5 }}>
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <OpenCashSessionForm
                errorMessage={error?.message}
                loading={loading}
                onSubmit={handleOpen}
                serverErrors={error?.validationErrors}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Alert severity="info" sx={{ border: 1, borderColor: 'info.light' }}>
            La sesion permanece abierta aunque cierres sesion en la aplicacion.
          </Alert>
        </Grid>
      </Grid>
    </Stack>
  )
}
