import { z } from 'zod'
import { USER_ROLES } from '../../domain/entities/User'

const roleSchema = z.enum(USER_ROLES)

export const getUserSchema = (mode: 'create' | 'edit') =>
  z.object({
    username: z
      .string()
      .trim()
      .min(1, 'El usuario es obligatorio')
      .max(100, 'El usuario no debe superar los 100 caracteres'),
    password:
      mode === 'create'
        ? z
            .string()
            .min(1, 'La contrasena es obligatoria')
            .min(8, 'La contrasena debe tener al menos 8 caracteres')
        : z.string().optional(),
    role: roleSchema,
    active: z.boolean(),
  })

export type UserFormValues = z.infer<ReturnType<typeof getUserSchema>>
