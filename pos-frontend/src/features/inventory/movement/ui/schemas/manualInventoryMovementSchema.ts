import { z } from 'zod'

const hasUpToTwoDecimals = (value: number): boolean => {
  return Number.isInteger(Math.round(value * 100) - value * 100)
}

export const manualInventoryMovementSchema = z.object({
  productId: z.number().positive('El producto es obligatorio'),
  quantity: z
    .number({ error: 'La cantidad es obligatoria' })
    .positive('La cantidad debe ser mayor que cero')
    .max(99999999.99, 'La cantidad no debe superar 8 enteros y 2 decimales')
    .refine(hasUpToTwoDecimals, 'La cantidad debe tener maximo 2 decimales'),
  description: z
    .string()
    .trim()
    .min(1, 'La descripcion es obligatoria')
    .max(255, 'La descripcion no debe superar los 255 caracteres'),
})

export type ManualInventoryMovementFormValues = z.infer<typeof manualInventoryMovementSchema>
