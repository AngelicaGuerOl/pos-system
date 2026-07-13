import { z } from 'zod'

export const openCashSessionSchema = z.object({
  openingAmount: z
    .number({ error: 'El efectivo inicial es obligatorio' })
    .min(0, 'El efectivo inicial no puede ser negativo'),
})

export type OpenCashSessionFormValues = z.infer<typeof openCashSessionSchema>
