import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PRODUCT_UNIT_LABELS } from '../../../catalog/products'
import { ROUTE_PATHS } from '../../../../shared/routes/routePaths'
import { PageHeader } from '../../../../shared/ui/components/PageHeader'
import { formatCurrency, formatDateTime, formatNumber } from '../../../../shared/utils/formatters'
import type {
  DashboardAdminSummary,
  DashboardCashierSummary,
  DashboardRecentSale,
} from '../../domain/entities/DashboardSummary'
import { useDashboardSummary } from '../hooks/useDashboardSummary'

const SALE_TYPE_LABELS = {
  CASH: 'Contado',
  CREDIT: 'Fiado',
} as const

const SALE_STATUS_LABELS = {
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  PARTIALLY_RETURNED: 'Devuelta parcialmente',
  RETURNED: 'Devuelta',
} as const

type MetricCardProps = {
  title: string
  value: string
  helper?: string
}

const MetricCard = ({ helper, title, value }: MetricCardProps) => (
  <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
    <CardContent>
      <Stack spacing={0.5}>
        <Typography color="text.secondary" variant="body2">
          {title}
        </Typography>
        <Typography sx={{ fontWeight: 900 }} variant="h5">
          {value}
        </Typography>
        {helper ? (
          <Typography color="text.secondary" variant="caption">
            {helper}
          </Typography>
        ) : null}
      </Stack>
    </CardContent>
  </Card>
)

type SectionCardProps = {
  title: string
  action?: ReactNode
  children: ReactNode
}

const SectionCard = ({ action, children, title }: SectionCardProps) => (
  <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
    <CardContent>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Typography sx={{ fontWeight: 800 }} variant="h6">
            {title}
          </Typography>
          {action}
        </Stack>
        {children}
      </Stack>
    </CardContent>
  </Card>
)

const EmptyText = ({ children }: { children: ReactNode }) => (
  <Typography color="text.secondary" variant="body2">
    {children}
  </Typography>
)

const RecentSalesTable = ({ sales }: { sales: DashboardRecentSale[] }) => {
  if (sales.length === 0) {
    return <EmptyText>No hay ventas recientes.</EmptyText>
  }

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell>Folio</TableCell>
            <TableCell>Fecha</TableCell>
            <TableCell>Cajero</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell>Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>#{sale.id}</TableCell>
              <TableCell>{formatDateTime(sale.createdAt)}</TableCell>
              <TableCell>{sale.cashierUsername}</TableCell>
              <TableCell>{sale.customerName}</TableCell>
              <TableCell>{SALE_TYPE_LABELS[sale.saleType]}</TableCell>
              <TableCell align="right">{formatCurrency(sale.total)}</TableCell>
              <TableCell>{SALE_STATUS_LABELS[sale.status]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

const AdminDashboard = ({ summary }: { summary: DashboardAdminSummary }) => {
  const navigate = useNavigate()

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            helper={`${formatNumber(summary.todaySales.salesCount)} ventas`}
            title="Total vendido hoy"
            value={formatCurrency(summary.todaySales.totalSalesAmount)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard title="Ventas en efectivo" value={formatCurrency(summary.todaySales.cashSalesAmount)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard title="Ventas fiadas" value={formatCurrency(summary.todaySales.creditSalesAmount)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            helper={`${formatNumber(summary.receivables.pendingAccountsCount)} cuentas pendientes`}
            title="Saldo pendiente por cobrar"
            value={formatCurrency(summary.receivables.pendingAmount)}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard
            action={<Button onClick={() => navigate(ROUTE_PATHS.products)} size="small">Ver productos</Button>}
            title={`Productos con stock bajo (${formatNumber(summary.inventory.lowStockCount)})`}
          >
            {summary.inventory.lowStockProducts.length === 0 ? (
              <EmptyText>No hay productos con stock bajo.</EmptyText>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1}>
                {summary.inventory.lowStockProducts.map((product) => (
                  <Stack
                    key={product.id}
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{product.name}</Typography>
                      <Typography color="text.secondary" variant="caption">
                        {PRODUCT_UNIT_LABELS[product.unit]}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 800, whiteSpace: 'nowrap' }} variant="body2">
                      {formatNumber(product.currentStock)} / {formatNumber(product.minimumStock)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard
            action={<Button onClick={() => navigate(ROUTE_PATHS.cashSessionsHistory)} size="small">Ver sesiones</Button>}
            title={`Cajas abiertas (${formatNumber(summary.cash.openSessionsCount)})`}
          >
            {summary.cash.openSessions.length === 0 ? (
              <EmptyText>No hay cajas abiertas.</EmptyText>
            ) : (
              <Stack divider={<Divider flexItem />} spacing={1}>
                {summary.cash.openSessions.map((session) => (
                  <Stack
                    key={session.sessionId}
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{session.username}</Typography>
                      <Typography color="text.secondary" variant="caption">
                        {formatDateTime(session.openedAt)}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 800, whiteSpace: 'nowrap' }} variant="body2">
                      {formatCurrency(session.expectedCash)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>
      </Grid>

      <SectionCard
        action={<Button onClick={() => navigate(ROUTE_PATHS.salesHistory)} size="small">Ver historial de ventas</Button>}
        title="Últimas ventas"
      >
        <RecentSalesTable sales={summary.recentSales} />
      </SectionCard>
    </Stack>
  )
}

const CashierDashboard = ({ summary }: { summary: DashboardCashierSummary }) => {
  const navigate = useNavigate()
  const session = summary.currentCashSession

  return (
    <Stack spacing={2.5}>
      <SectionCard title="Caja actual">
        {session.open ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}>
              <Chip color="success" label="Abierta" size="small" />
              <Typography color="text.secondary">
                Apertura: {session.openedAt ? formatDateTime(session.openedAt) : '—'}
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <MetricCard title="Fondo inicial" value={formatCurrency(session.openingAmount)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <MetricCard title="Entradas" value={formatCurrency(session.totalInflows)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <MetricCard title="Salidas" value={formatCurrency(session.totalOutflows)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <MetricCard title="Efectivo esperado" value={formatCurrency(session.expectedCash)} />
              </Grid>
            </Grid>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button onClick={() => navigate(ROUTE_PATHS.sales)} startIcon={<ReceiptLongRoundedIcon />} variant="contained">
                Nueva venta
              </Button>
              <Button onClick={() => navigate(ROUTE_PATHS.cashMovements)} startIcon={<PointOfSaleRoundedIcon />} variant="outlined">
                Movimientos de caja
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <EmptyText>No tienes una caja abierta.</EmptyText>
            <Box>
              <Button onClick={() => navigate(ROUTE_PATHS.cashSessionOpen)} variant="contained">
                Abrir caja
              </Button>
            </Box>
          </Stack>
        )}
      </SectionCard>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard
            title="Ventas de la sesión"
            value={formatNumber(summary.currentSessionSales.salesCount)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard title="Ventas en efectivo" value={formatCurrency(summary.currentSessionSales.cashSalesAmount)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard title="Ventas fiadas" value={formatCurrency(summary.currentSessionSales.creditSalesAmount)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <MetricCard title="Total vendido" value={formatCurrency(summary.currentSessionSales.totalSalesAmount)} />
        </Grid>
      </Grid>

      <SectionCard title="Acciones rápidas">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button onClick={() => navigate(ROUTE_PATHS.sales)} startIcon={<ReceiptLongRoundedIcon />}>
            Nueva venta
          </Button>
          <Button onClick={() => navigate(ROUTE_PATHS.salesHistory)} startIcon={<SearchRoundedIcon />}>
            Historial de ventas
          </Button>
          <Button onClick={() => navigate(ROUTE_PATHS.cashMovements)} startIcon={<PointOfSaleRoundedIcon />}>
            Movimientos de caja
          </Button>
        </Stack>
      </SectionCard>

      <SectionCard title="Últimas ventas">
        <RecentSalesTable sales={summary.recentSales} />
      </SectionCard>
    </Stack>
  )
}

export const DashboardPage = () => {
  const { error, loading, refetch, summary } = useDashboardSummary()

  return (
    <Stack spacing={3}>
      <PageHeader
        actionLabel="Actualizar"
        onAction={() => {
          void refetch()
        }}
        subtitle={summary?.role === 'CASHIER'
          ? 'Consulta el estado de tu caja y tus operaciones recientes.'
          : 'Consulta el estado general del sistema.'}
        title="Dashboard"
      />

      {loading ? <LinearProgress /> : null}

      {error ? (
        <Alert
          action={<Button color="inherit" onClick={() => { void refetch() }} size="small">Reintentar</Button>}
          severity="error"
        >
          {error.message}
        </Alert>
      ) : null}

      {!loading && summary?.adminSummary ? <AdminDashboard summary={summary.adminSummary} /> : null}
      {!loading && summary?.cashierSummary ? <CashierDashboard summary={summary.cashierSummary} /> : null}
    </Stack>
  )
}
