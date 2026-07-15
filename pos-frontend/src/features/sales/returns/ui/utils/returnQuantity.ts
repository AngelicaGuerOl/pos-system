import type { SaleItem } from '../../../domain/entities/Sale'

export const getQuantityStep = (item: SaleItem): number => {
  return item.productUnit === 'KG' || item.productUnit === 'LITER' ? 0.01 : 1
}

export const clampReturnQuantity = (value: number, item: SaleItem): number => {
  const step = getQuantityStep(item)
  const min = Math.min(step, item.returnableQuantity)
  const clamped = Math.min(Math.max(value, min), item.returnableQuantity)
  return Number(clamped.toFixed(2))
}

export const getInitialReturnQuantity = (item: SaleItem): number => {
  return clampReturnQuantity(getQuantityStep(item), item)
}
