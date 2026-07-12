import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  USER_ROLE_LABELS,
  USER_ROLES,
  type User,
  type UserCreateMutation,
  type UserUpdateMutation,
} from '../../domain/entities/User'
import { getUserSchema, type UserFormValues } from '../schemas/userSchema'

type UserSubmitValues =
  | { mode: 'create'; values: UserCreateMutation }
  | { mode: 'edit'; values: UserUpdateMutation }

type UserFormProps = {
  mode: 'create' | 'edit'
  initialValues?: User | null
  loading?: boolean
  onCancel: () => void
  onSubmit: (values: UserSubmitValues) => void
  serverErrors?: Record<string, string>
}

const getDefaultValues = (user?: User | null): UserFormValues => ({
  username: user?.username ?? '',
  password: '',
  role: user?.role ?? 'CASHIER',
  active: user?.active ?? true,
})

export const UserForm = ({
  mode,
  initialValues,
  loading = false,
  onCancel,
  onSubmit,
  serverErrors = {},
}: UserFormProps) => {
  const schema = useMemo(() => getUserSchema(mode), [mode])
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<UserFormValues>({
    defaultValues: getDefaultValues(initialValues),
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    reset(getDefaultValues(initialValues))
  }, [initialValues, reset])

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit((values) => {
        if (mode === 'create') {
          onSubmit({
            mode,
            values: {
              username: values.username,
              password: values.password ?? '',
              role: values.role,
            },
          })
          return
        }

        onSubmit({
          mode,
          values: {
            username: values.username,
            role: values.role,
            active: values.active,
          },
        })
      })}
    >
      <Stack spacing={2.5}>
        <TextField
          autoFocus
          disabled={loading}
          error={Boolean(errors.username || serverErrors.username)}
          fullWidth
          helperText={errors.username?.message ?? serverErrors.username}
          label="Usuario"
          {...register('username')}
        />

        {mode === 'create' ? (
          <TextField
            disabled={loading}
            error={Boolean(errors.password || serverErrors.password)}
            fullWidth
            helperText={errors.password?.message ?? serverErrors.password}
            label="Contrasena temporal"
            type="password"
            {...register('password')}
          />
        ) : null}

        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <FormControl error={Boolean(errors.role || serverErrors.role)} fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select disabled={loading} label="Rol" {...field}>
                {USER_ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {USER_ROLE_LABELS[role]}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors.role?.message ?? serverErrors.role}</FormHelperText>
            </FormControl>
          )}
        />

        {mode === 'edit' ? (
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <FormControl error={Boolean(errors.active || serverErrors.active)}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      disabled={loading}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  }
                  label="Usuario activo"
                />
                <FormHelperText>{errors.active?.message ?? serverErrors.active}</FormHelperText>
              </FormControl>
            )}
          />
        ) : null}

        <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
          <Button disabled={loading} onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={loading} type="submit" variant="contained">
            Guardar
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
