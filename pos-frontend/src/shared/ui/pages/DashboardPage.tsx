import { Box, Paper, Typography } from '@mui/material'
import { DashboardLayout } from '../layout/DashboardLayout'

export const DashboardPage = () => {
  return (
    <DashboardLayout>
      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          p: { xs: 3, md: 4 },
        }}
      >
        <Box>
          <Typography component="h1" sx={{ fontWeight: 800 }} variant="h4">
            POS Dashboard
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Modulo base listo para conectar productos, clientes, ventas y reportes.
          </Typography>
        </Box>
      </Paper>
    </DashboardLayout>
  )
}

