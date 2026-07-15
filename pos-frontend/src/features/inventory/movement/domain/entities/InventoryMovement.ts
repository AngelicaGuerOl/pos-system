export type InventoryMovementDirection = 'IN' | 'OUT'

export type InventoryMovementType =
  | 'INITIAL_STOCK'
  | 'MANUAL_ENTRY'
  | 'MANUAL_EXIT'
  | 'SALE'
  | 'RETURN'
  | 'SALE_RETURN'

export type InventoryMovement = {
  id: number
  productId: number
  productBarcode: string
  productName: string
  productUnit: string
  createdById: number
  createdByUsername: string
  direction: InventoryMovementDirection
  type: InventoryMovementType
  quantity: number
  previousStock: number
  newStock: number
  description: string
  sourceType: string | null
  sourceId: number | null
  createdAt: string
}

export type ManualInventoryMovementData = {
  productId: number
  quantity: number
  description: string
}

export type InventoryMovementFilters = {
  search?: string
  productId?: number
  direction?: InventoryMovementDirection
  type?: InventoryMovementType
  from?: string
  to?: string
  page: number
  size: number
  sort?: string
}

export const INVENTORY_MOVEMENT_DIRECTION_LABELS: Record<InventoryMovementDirection, string> = {
  IN: 'Entrada',
  OUT: 'Salida',
}

export const INVENTORY_MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, string> = {
  INITIAL_STOCK: 'Stock inicial',
  MANUAL_ENTRY: 'Entrada manual',
  MANUAL_EXIT: 'Salida manual',
  SALE: 'Venta',
  RETURN: 'Devolucion',
  SALE_RETURN: 'Devolucion de venta',
}
