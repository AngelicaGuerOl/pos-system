import LockRoundedIcon from '@mui/icons-material/LockRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
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
import logo from '../../../../assets/logo-cropped.png'
import { useLogin } from '../hooks/useLogin'
import { PasswordVisibilityAdornment } from './PasswordVisibilityAdornment'

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { form, onSubmit, loading, errorMessage } = useLogin()
  const {
    formState: { errors },
    register,
  } = form

  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0 18px 50px rgba(15, 23, 42, 0.10)',
        maxWidth: 440,
        p: { xs: 3, sm: 4 },
        width: '100%',
      }}
    >
      <Stack spacing={3}>
        <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            component="img"
            alt="NovaPOS"
            src={logo}
            sx={{
              height: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              width: { xs: 250, sm: 310 },
            }}
          />

          <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
            Inicia sesion para continuar
          </Typography>
        </Stack>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Box component="form" noValidate onSubmit={onSubmit}>
          <Stack spacing={2.25}>
            <TextField
              autoComplete="username"
              autoFocus
              disabled={loading}
              error={Boolean(errors.username)}
              fullWidth
              helperText={errors.username?.message}
              label="Usuario"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonRoundedIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              {...register('username')}
            />

            <TextField
              autoComplete="current-password"
              disabled={loading}
              error={Boolean(errors.password)}
              fullWidth
              helperText={errors.password?.message}
              label="Contrasena"
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
                      onToggle={() => setShowPassword((current) => !current)}
                      visible={showPassword}
                    />
                  ),
                },
              }}
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
            />

            <Button
              disabled={loading}
              fullWidth
              size="large"
              sx={{ py: 1.35 }}
              type="submit"
              variant="contained"
            >
              {loading ? <CircularProgress color="inherit" size={22} /> : 'Iniciar sesion'}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  )
}
