import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import { Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth'
import { ROUTE_PATHS } from '../../../../shared/routes/routePaths'
import { PageHeader } from '../../../../shared/ui/components/PageHeader'

const quickActions = [
  {
    title: 'Categorias',
    description: 'Organiza el catalogo por grupos de productos.',
    icon: <CategoryRoundedIcon color="primary" />,
    path: ROUTE_PATHS.categories,
  },
  {
    title: 'Productos',
    description: 'Gestiona precios, existencias y codigos de barras.',
    icon: <Inventory2RoundedIcon color="primary" />,
    path: ROUTE_PATHS.products,
  },
  {
    title: 'Clientes',
    description: 'Modulo preparado para el directorio de clientes.',
    icon: <PeopleRoundedIcon color="primary" />,
    path: ROUTE_PATHS.customers,
  },
  {
    title: 'Ventas',
    description: 'Modulo preparado para operaciones de venta.',
    icon: <ReceiptLongRoundedIcon color="primary" />,
    path: ROUTE_PATHS.sales,
  },
]

export const DashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle={`Bienvenida, ${user?.username ?? 'usuario'}. Selecciona una accion para continuar.`}
        title="Dashboard"
      />

      <Grid container spacing={2}>
        {quickActions.map((action) => (
          <Grid key={action.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
              <CardActionArea onClick={() => navigate(action.path)} sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={2}>
                    {action.icon}
                    <Stack spacing={0.5}>
                      <Typography sx={{ fontWeight: 800 }}>{action.title}</Typography>
                      <Typography color="text.secondary" variant="body2">
                        {action.description}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

