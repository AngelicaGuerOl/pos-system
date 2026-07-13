import { z } from 'zod'

const hasUpToTwoDecimals = (value: number): boolean => {
  return Number.isInteger(Math.round(value * 100) - value * 100)
}

export const manualCashMovementSchema = z.object({
  amount: z
    .number({ error: 'El monto es obligatorio' })
    .positive('El monto debe ser mayor que cero')
    .max(9999999999.99, 'El monto no debe superar 10 enteros y 2 decimales')
    .refine(hasUpToTwoDecimals, 'El monto debe tener maximo 2 decimales'),
  description: z
    .string()
    .trim()
    .min(1, 'La descripcion es obligatoria')
    .max(255, 'La descripcion no debe superar los 255 caracteres'),
})

export type ManualCashMovementFormValues = z.infer<typeof manualCashMovementSchema>
