export type ProductUnit = 'PIECE' | 'KG' | 'LITER' | 'PACKAGE'

export type Product = {
  id: number
  categoryId: number
  categoryName: string
  barcode: string
  name: string
  description: string | null
  unit: ProductUnit
  costPrice: number
  salePrice: number
  currentStock: number
  minimumStock: number
  active: boolean
  createdAt: string
  updatedAt: string | null
}

export type ProductFilters = {
  search?: string
  categoryId?: number | null
  lowStock?: boolean
}

export type ProductMutation = {
  categoryId: number
  barcode: string
  name: string
  description?: string | null
  unit: ProductUnit
  costPrice: number
  salePrice: number
  currentStock: number
  minimumStock: number
}

export const PRODUCT_UNITS: ProductUnit[] = ['PIECE', 'KG', 'LITER', 'PACKAGE']

export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = {
  PIECE: 'Pieza',
  KG: 'Kilogramo',
  LITER: 'Litro',
  PACKAGE: 'Paquete',
}

