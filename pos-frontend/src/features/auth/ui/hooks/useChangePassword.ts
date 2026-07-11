import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { useFormErrors } from '../../../../shared/lib/forms/useFormErrors'
import { ROUTE_PATHS } from '../../../../shared/routes/routePaths'
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '../schemas/changePasswordSchema'
import { useAuth } from './useAuth'

export const useChangePassword = () => {
  const navigate = useNavigate()
  const { changePassword } = useAuth()
  const [apiError, setApiError] = useState<NormalizedApiError | null>(null)

  const form = useForm<ChangePasswordFormValues>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
    resolver: zodResolver(changePasswordSchema),
  })

  const { generalError } = useFormErrors(apiError)

  const onSubmit = form.handleSubmit(async (values) => {
    setApiError(null)

    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      navigate(ROUTE_PATHS.dashboard, { replace: true })
    } catch (error) {
      setApiError(normalizeApiError(error))
    }
  })

  return {
    errorMessage: generalError,
    form,
    loading: form.formState.isSubmitting,
    onSubmit,
  }
}

