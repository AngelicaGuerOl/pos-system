import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(150, 'Maximo 150 caracteres'),
  contactName: z.string().trim().max(120, 'Maximo 120 caracteres').optional().or(z.literal('')),
  phone: z.string().trim().max(30, 'Maximo 30 caracteres').optional().or(z.literal('')),
  email: z.string().trim().email('Correo no valido').max(120, 'Maximo 120 caracteres').optional().or(z.literal('')),
  notes: z.string().trim().max(500, 'Maximo 500 caracteres').optional().or(z.literal('')),
})

export type SupplierFormValues = z.infer<typeof supplierSchema>
