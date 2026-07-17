import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import GroupRoundedIcon from '@mui/icons-material/GroupRounded'
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded'
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded'
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded'
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded'
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Collapse,
  Divider,
  Dialog,
  DialogContent,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChangePasswordForm, useAuth } from '../../../features/auth'
import type { UserRole } from '../../../features/auth'
import logo from '../../../assets/logo-cropped.png'
import { ROUTE_PATHS } from '../../routes/routePaths'

const DRAWER_WIDTH = 280

type NavigationItem = {
  label: string
  path?: string
  icon: ReactNode
  roles?: UserRole[]
  children?: NavigationItem[]
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: ROUTE_PATHS.dashboard,
    icon: <DashboardRoundedIcon />,
  },
  {
    label: 'Catalogo',
    icon: <Inventory2RoundedIcon />,
    children: [
      {
        label: 'Categorias',
        path: ROUTE_PATHS.categories,
        icon: <CategoryRoundedIcon />,
      },
      {
        label: 'Productos',
        path: ROUTE_PATHS.products,
        icon: <Inventory2RoundedIcon />,
      },
      {
        label: 'Proveedores',
        path: ROUTE_PATHS.suppliers,
        icon: <LocalShippingRoundedIcon />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    label: 'Inventario',
    icon: <InventoryRoundedIcon />,
    roles: ['ADMIN'],
    children: [
      {
        label: 'Movimientos de inventario',
        path: ROUTE_PATHS.inventoryMovements,
        icon: <InventoryRoundedIcon />,
        roles: ['ADMIN'],
      },
      {
        label: 'Registrar mercancia',
        path: ROUTE_PATHS.supplierEntriesCreate,
        icon: <LocalShippingRoundedIcon />,
        roles: ['ADMIN'],
      },
      {
        label: 'Historial de entradas',
        path: ROUTE_PATHS.supplierEntries,
        icon: <SearchRoundedIcon />,
        roles: ['ADMIN'],
      },
      {
        label: 'Corte por proveedor',
        path: ROUTE_PATHS.supplierSettlementCreate,
        icon: <ReceiptLongRoundedIcon />,
        roles: ['ADMIN'],
      },
      {
        label: 'Historial de cortes',
        path: ROUTE_PATHS.supplierSettlements,
        icon: <SearchRoundedIcon />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    label: 'Clientes',
    path: ROUTE_PATHS.customers,
    icon: <PeopleRoundedIcon />,
  },
  {
    label: 'Caja',
    icon: <PointOfSaleRoundedIcon />,
    children: [
      {
        label: 'Movimientos',
        path: ROUTE_PATHS.cashMovements,
        icon: <PointOfSaleRoundedIcon />,
      },
      {
        label: 'Historial de sesiones',
        path: ROUTE_PATHS.cashSessionsHistory,
        icon: <ReceiptRoundedIcon />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    label: 'Ventas',
    icon: <ReceiptLongRoundedIcon />,
    children: [
      {
        label: 'Nueva venta',
        path: ROUTE_PATHS.sales,
        icon: <ReceiptLongRoundedIcon />,
      },
      {
        label: 'Historial de ventas',
        path: ROUTE_PATHS.salesHistory,
        icon: <SearchRoundedIcon />,
      },
      {
        label: 'Cuentas por cobrar',
        path: ROUTE_PATHS.receivables,
        icon: <RequestQuoteRoundedIcon />,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    label: 'Reportes',
    path: ROUTE_PATHS.reports,
    icon: <AssessmentRoundedIcon />,
    roles: ['ADMIN'],
  },
  {
    label: 'Usuarios',
    path: ROUTE_PATHS.users,
    icon: <GroupRoundedIcon />,
    roles: ['ADMIN'],
  },
]

export const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Catalogo: true,
    Ventas: true,
  })
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()

  const handleNavigate = (path?: string) => {
    if (!path) {
      return
    }

    navigate(path)
    setMobileOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    setUserMenuAnchor(null)
    navigate(ROUTE_PATHS.login, { replace: true })
  }

  const handleChangePassword = () => {
    setUserMenuAnchor(null)
    setChangePasswordOpen(true)
  }

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            component="img"
            alt="NovaPOS"
            src={logo}
            sx={{
              height: 'auto',
              objectFit: 'contain',
              width: 168,
            }}
          />
        </Stack>
      </Toolbar>

      <Divider />

      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {navigationItems
          .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
          .map((item) => {
          const selected = item.path ? location.pathname === item.path : false

          if (item.children) {
            const visibleChildren = item.children.filter(
              (child) => !child.roles || (user && child.roles.includes(user.role)),
            )
            const childSelected = visibleChildren.some((child) => child.path === location.pathname)
            const groupOpen = openGroups[item.label] ?? false

            if (visibleChildren.length === 0) {
              return null
            }

            return (
              <Box key={item.label}>
                <ListItemButton
                  onClick={() =>
                    setOpenGroups((current) => ({
                      ...current,
                      [item.label]: !groupOpen,
                    }))
                  }
                  selected={childSelected}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                  {groupOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                </ListItemButton>
                <Collapse in={groupOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 1.5 }}>
                    {visibleChildren.map((child) => (
                      <ListItemButton
                        key={child.label}
                        onClick={() => handleNavigate(child.path)}
                        selected={location.pathname === child.path}
                        sx={{ borderRadius: 1, my: 0.5 }}
                      >
                        <ListItemIcon>{child.icon}</ListItemIcon>
                        <ListItemText primary={child.label} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            )
          }

          return (
            <ListItemButton
              key={item.label}
              onClick={() => handleNavigate(item.path)}
              selected={selected}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )

  return (
    <Box sx={{ bgcolor: 'background.default', display: 'flex', minHeight: '100vh' }}>
      <AppBar
        color="inherit"
        elevation={0}
        position="fixed"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          ml: { lg: `${DRAWER_WIDTH}px` },
          width: { lg: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            {!isDesktop ? (
              <IconButton edge="start" onClick={() => setMobileOpen(true)}>
                <MenuRoundedIcon />
              </IconButton>
            ) : null}
            <Box>
              <Typography sx={{ fontWeight: 800 }}>Panel administrativo</Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button
              color="inherit"
              endIcon={<ExpandMoreRoundedIcon />}
              onClick={(event) => setUserMenuAnchor(event.currentTarget)}
              sx={{
                borderRadius: 1,
                minWidth: 0,
                px: { xs: 1, sm: 1.5 },
                textAlign: 'left',
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', height: 32, width: 32 }}>
                  {user?.username?.slice(0, 1).toUpperCase() ?? 'U'}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.15 }}>
                    {user?.username ?? 'Usuario'}
                  </Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.15 }} variant="caption">
                    {user?.role ?? 'Sin rol'}
                  </Typography>
                </Box>
              </Stack>
            </Button>

            <Menu
              anchorEl={userMenuAnchor}
              onClose={() => setUserMenuAnchor(null)}
              open={Boolean(userMenuAnchor)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleChangePassword}>
                <ListItemIcon>
                  <VpnKeyRoundedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Cambiar contrasena" />
              </MenuItem>
            </Menu>

            <IconButton aria-label="Cerrar sesion" onClick={handleLogout}>
              <LogoutRoundedIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ flexShrink: { lg: 0 }, width: { lg: DRAWER_WIDTH } }}>
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          variant="temporary"
        >
          {drawerContent}
        </Drawer>
        <Drawer
          open
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': {
              borderRight: 1,
              borderColor: 'divider',
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          variant="permanent"
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 3 },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => setChangePasswordOpen(false)}
        open={changePasswordOpen}
      >
        <DialogContent sx={{ p: { xs: 3, sm: 4 } }}>
          <ChangePasswordForm
            onSuccess={() => setChangePasswordOpen(false)}
            showLogout={false}
            subtitle="Actualiza tu contrasena de acceso."
            variant="embedded"
          />
        </DialogContent>
      </Dialog>
    </Box>
  )
}
