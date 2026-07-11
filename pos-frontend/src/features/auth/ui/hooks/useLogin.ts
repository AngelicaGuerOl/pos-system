import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { useFormErrors } from '../../../../shared/lib/forms/useFormErrors'
import { ROUTE_PATHS } from '../../../../shared/routes/routePaths'
import { loginSchema, type LoginFormValues } from '../schemas/loginSchema'
import { useAuth } from './useAuth'

export const useLogin = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [apiError, setApiError] = useState<NormalizedApiError | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
    mode: 'onTouched',
  })

  const { generalError } = useFormErrors(apiError)

  const onSubmit = form.handleSubmit(async (values) => {
    setApiError(null)

    try {
      const authenticatedUser = await login(values.username, values.password)
      navigate(
        authenticatedUser.mustChangePassword
          ? ROUTE_PATHS.changePassword
          : ROUTE_PATHS.dashboard,
        { replace: true },
      )
    } catch (error) {
      setApiError(normalizeApiError(error))
    }
  })

  return {
    form,
    onSubmit,
    loading: form.formState.isSubmitting,
    errorMessage: generalError,
  }
}
