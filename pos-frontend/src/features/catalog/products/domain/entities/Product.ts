export type ProductUnit = 'PIECE' | 'KG' | 'LITER' | 'PACKAGE'

export type Product = {
  id: number
  categoryId: number
  categoryName: string
  supplierId: number | null
  supplierName: string | null
  barcode: string
  name: string
  description: string | null
  unit: ProductUnit
  costPrice: number
  costPriceKnown: boolean
  salePrice: number
  currentStock: number
  minimumStock: number
  active: boolean
  createdAt: string
  updatedAt: string | null
}

export type BarcodeLookupStatus = 'LOCAL_PRODUCT_EXISTS' | 'EXTERNAL_MATCH' | 'NOT_FOUND'

export type BarcodeLookup = {
  status: BarcodeLookupStatus
  barcode: string
  existingProductId: number | null
  existingProductActive: boolean | null
  existingProduct: Product | null
  suggestedName: string | null
  brand: string | null
  presentation: string | null
  source: string | null
}

export type ProductFilters = {
  search?: string
  categoryId?: number | null
  supplierId?: number | null
  active?: boolean | null
  lowStock?: boolean
  page?: number
  size?: number
  sort?: string
}

export type ProductMutation = {
  categoryId: number
  supplierId?: number | null
  barcode: string
  name: string
  description?: string | null
  unit: ProductUnit
  costPrice: number
  salePrice: number
  currentStock?: number
  minimumStock: number
}

export const PRODUCT_UNITS: ProductUnit[] = ['PIECE', 'KG', 'LITER', 'PACKAGE']

export const PRODUCT_UNIT_LABELS: Record<ProductUnit, string> = {
  PIECE: 'Pieza',
  KG: 'Kilogramo',
  LITER: 'Litro',
  PACKAGE: 'Paquete',
}
