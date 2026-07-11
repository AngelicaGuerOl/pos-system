import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'El usuario es obligatorio'),
  password: z
    .string()
    .min(1, 'La contrasena es obligatoria')
    .min(8, 'La contrasena debe tener al menos 8 caracteres'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

