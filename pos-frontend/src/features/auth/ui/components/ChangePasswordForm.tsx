import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useChangePassword } from '../hooks/useChangePassword'
import { PasswordVisibilityAdornment } from './PasswordVisibilityAdornment'

export const ChangePasswordForm = () => {
  const [visibleFields, setVisibleFields] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const { logout } = useAuth()
  const { errorMessage, form, loading, onSubmit } = useChangePassword()
  const {
    formState: { errors },
    register,
  } = form

  const toggleVisibility = (field: keyof typeof visibleFields) => {
    setVisibleFields((current) => ({
      ...current,
      [field]: !current[field],
    }))
  }

  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0 18px 50px rgba(15, 23, 42, 0.10)',
        maxWidth: 460,
        p: { xs: 3, sm: 4 },
        width: '100%',
      }}
    >
      <Stack spacing={3}>
        <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Box
            sx={{
              alignItems: 'center',
              bgcolor: 'primary.main',
              borderRadius: 2,
              color: 'primary.contrastText',
              display: 'flex',
              height: 52,
              justifyContent: 'center',
              width: 52,
            }}
          >
            <LockResetRoundedIcon />
          </Box>
          <Box>
            <Typography component="h1" sx={{ fontWeight: 800 }} variant="h4">
              Cambiar contrasena
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Debes actualizar tu contrasena antes de continuar.
            </Typography>
          </Box>
        </Stack>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Box component="form" noValidate onSubmit={onSubmit}>
          <Stack spacing={2.25}>
            <TextField
              autoComplete="current-password"
              disabled={loading}
              error={Boolean(errors.currentPassword)}
              fullWidth
              helperText={errors.currentPassword?.message}
              label="Contrasena actual"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRoundedIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <PasswordVisibilityAdornment
                      disabled={loading}
                      onToggle={() => toggleVisibility('currentPassword')}
                      visible={visibleFields.currentPassword}
                    />
                  ),
                },
              }}
              type={visibleFields.currentPassword ? 'text' : 'password'}
              {...register('currentPassword')}
            />
            <TextField
              autoComplete="new-password"
              disabled={loading}
              error={Boolean(errors.newPassword)}
              fullWidth
              helperText={errors.newPassword?.message}
              label="Nueva contrasena"
              slotProps={{
                input: {
                  endAdornment: (
                    <PasswordVisibilityAdornment
                      disabled={loading}
                      onToggle={() => toggleVisibility('newPassword')}
                      visible={visibleFields.newPassword}
                    />
                  ),
                },
              }}
              type={visibleFields.newPassword ? 'text' : 'password'}
              {...register('newPassword')}
            />
            <TextField
              autoComplete="new-password"
              disabled={loading}
              error={Boolean(errors.confirmPassword)}
              fullWidth
              helperText={errors.confirmPassword?.message}
              label="Confirmar nueva contrasena"
              slotProps={{
                input: {
                  endAdornment: (
                    <PasswordVisibilityAdornment
                      disabled={loading}
                      onToggle={() => toggleVisibility('confirmPassword')}
                      visible={visibleFields.confirmPassword}
                    />
                  ),
                },
              }}
              type={visibleFields.confirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
            />

            <Button
              disabled={loading}
              fullWidth
              size="large"
              sx={{ py: 1.35 }}
              type="submit"
              variant="contained"
            >
              {loading ? <CircularProgress color="inherit" size={22} /> : 'Actualizar contrasena'}
            </Button>
            <Button
              color="inherit"
              disabled={loading}
              fullWidth
              onClick={() => void logout()}
              variant="text"
            >
              Cerrar sesion
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  )
}
