import { z } from 'zod'

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contrasena actual es obligatoria'),
    newPassword: z
      .string()
      .min(1, 'La nueva contrasena es obligatoria')
      .min(8, 'La nueva contrasena debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contrasena'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contrasenas no coinciden',
    path: ['confirmPassword'],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

