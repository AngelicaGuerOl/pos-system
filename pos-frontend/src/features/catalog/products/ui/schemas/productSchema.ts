import { z } from 'zod'
import { PRODUCT_UNITS } from '../../domain/entities/Product'

export const productSchema = z
  .object({
    categoryId: z.number().positive('La categoria es obligatoria'),
    barcode: z
      .string()
      .trim()
      .min(1, 'El codigo de barras es obligatorio')
      .max(50, 'El codigo de barras no debe superar los 50 caracteres'),
    name: z
      .string()
      .trim()
      .min(1, 'El nombre es obligatorio')
      .max(180, 'El nombre no debe superar los 180 caracteres'),
    description: z
      .string()
      .trim()
      .max(255, 'La descripcion no debe superar los 255 caracteres')
      .optional()
      .or(z.literal('')),
    unit: z.enum(PRODUCT_UNITS, { error: 'La unidad es obligatoria' }),
    costPrice: z.number().min(0, 'El precio de costo debe ser mayor o igual a 0'),
    salePrice: z.number().min(0, 'El precio de venta debe ser mayor o igual a 0'),
    currentStock: z.number().min(0, 'El stock actual debe ser mayor o igual a 0'),
    minimumStock: z.number().min(0, 'El stock minimo debe ser mayor o igual a 0'),
  })
  .refine((data) => data.salePrice >= data.costPrice, {
    message: 'El precio de venta debe ser mayor o igual al costo',
    path: ['salePrice'],
  })

export type ProductFormValues = z.infer<typeof productSchema>
