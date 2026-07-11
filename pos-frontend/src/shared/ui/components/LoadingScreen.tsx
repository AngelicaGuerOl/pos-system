import { Box, CircularProgress, Typography } from '@mui/material'

export const LoadingScreen = () => {
  return (
    <Box
      sx={{
        alignItems: 'center',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minHeight: '100vh',
        justifyContent: 'center',
      }}
    >
      <CircularProgress size={32} />
      <Typography color="text.secondary" variant="body2">
        Cargando sesion
      </Typography>
    </Box>
  )
}

