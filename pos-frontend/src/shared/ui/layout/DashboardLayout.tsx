import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded'
import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material'
import type { PropsWithChildren } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth'
import { ROUTE_PATHS } from '../../routes/routePaths'
import { PageContainer } from '../components/PageContainer'

export const DashboardLayout = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate(ROUTE_PATHS.login, { replace: true })
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar
        color="inherit"
        elevation={0}
        position="sticky"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                alignItems: 'center',
                bgcolor: 'primary.main',
                borderRadius: 1,
                color: 'primary.contrastText',
                display: 'flex',
                height: 36,
                justifyContent: 'center',
                width: 36,
              }}
            >
              <PointOfSaleRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                POS Dashboard
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {user?.username ?? 'Usuario'}
              </Typography>
            </Box>
          </Stack>

          <Button
            color="inherit"
            onClick={handleLogout}
            size="small"
            startIcon={<LogoutRoundedIcon />}
            variant="outlined"
          >
            Salir
          </Button>
        </Toolbar>
      </AppBar>

      <PageContainer>{children}</PageContainer>
    </Box>
  )
}
