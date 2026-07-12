import { z } from 'zod'

export const customerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(80, 'El nombre no debe superar los 80 caracteres'),
  lastName: z
    .string()
    .trim()
    .min(1, 'El apellido es obligatorio')
    .max(100, 'El apellido no debe superar los 100 caracteres'),
  phone: z
    .string()
    .trim()
    .max(20, 'El telefono no debe superar los 20 caracteres')
    .optional(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>
