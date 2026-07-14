import { z } from 'zod'

const hasTwoDecimals = (value: number): boolean => {
  return Number.isInteger(Math.round(value * 100) - value * 100)
}

export const createCashCheckoutSchema = (total: number) =>
  z.object({
    cashReceived: z
      .number({ error: 'El efectivo recibido es obligatorio' })
      .finite('Ingresa un monto valido')
      .positive('El efectivo recibido debe ser mayor que cero')
      .refine(hasTwoDecimals, 'El efectivo recibido debe tener maximo 2 decimales')
      .refine((value) => value >= total, 'El efectivo recibido debe cubrir el total'),
  })

export type CashCheckoutFormValues = z.infer<ReturnType<typeof createCashCheckoutSchema>>
