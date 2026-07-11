import { z } from 'zod'

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no debe superar los 100 caracteres'),
  description: z
    .string()
    .trim()
    .max(255, 'La descripcion no debe superar los 255 caracteres')
    .optional()
    .or(z.literal('')),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

