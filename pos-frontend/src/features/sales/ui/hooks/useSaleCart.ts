import { useCallback, useMemo, useState } from 'react'
import type { Product, ProductUnit } from '../../../catalog/products'

export type SaleCartItem = {
  productId: number
  barcode: string
  name: string
  unit: ProductUnit
  salePrice: number
  availableStock: number
  quantity: number
  lineTotal: number
}

type CartOperationResult = {
  success: boolean
  message?: string
}

const MAX_DECIMALS = 2

const hasValidScale = (value: number): boolean => {
  return Number.isInteger(Math.round(value * 100) - value * 100)
}

const roundMoney = (value: number): number => {
  return Math.round(value * 100) / 100
}

const toCartItem = (product: Product, quantity: number): SaleCartItem => ({
  productId: product.id,
  barcode: product.barcode,
  name: product.name,
  unit: product.unit,
  salePrice: product.salePrice,
  availableStock: product.currentStock,
  quantity,
  lineTotal: roundMoney(product.salePrice * quantity),
})

const validateQuantity = (quantity: number, availableStock: number): string | null => {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 'La cantidad debe ser mayor que cero'
  }

  if (!hasValidScale(quantity)) {
    return `La cantidad debe tener maximo ${MAX_DECIMALS} decimales`
  }

  if (quantity > availableStock) {
    return 'No hay existencias suficientes para agregar otra unidad'
  }

  return null
}

export const useSaleCart = () => {
  const [items, setItems] = useState<SaleCartItem[]>([])

  const addProduct = useCallback((product: Product, quantity = 1): CartOperationResult => {
    if (!product.active) {
      return { success: false, message: 'El producto esta inactivo' }
    }

    if (product.currentStock <= 0) {
      return { success: false, message: 'El producto no tiene existencias disponibles' }
    }

    let result: CartOperationResult = { success: true }

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.productId === product.id)
      const nextQuantity = existingItem ? existingItem.quantity + quantity : quantity
      const validationMessage = validateQuantity(nextQuantity, product.currentStock)

      if (validationMessage) {
        result = { success: false, message: validationMessage }
        return currentItems
      }

      if (!existingItem) {
        return [...currentItems, toCartItem(product, nextQuantity)]
      }

      return currentItems.map((item) =>
        item.productId === product.id
          ? {
              ...item,
              availableStock: product.currentStock,
              salePrice: product.salePrice,
              quantity: nextQuantity,
              lineTotal: roundMoney(product.salePrice * nextQuantity),
            }
          : item,
      )
    })

    return result
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number): CartOperationResult => {
    let result: CartOperationResult = { success: true }

    setItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.productId !== productId) {
          return [item]
        }

        const validationMessage = validateQuantity(quantity, item.availableStock)

        if (validationMessage) {
          result = { success: false, message: validationMessage }
          return [item]
        }

        return [{ ...item, quantity, lineTotal: roundMoney(item.salePrice * quantity) }]
      }),
    )

    return result
  }, [])

  const increaseQuantity = useCallback((productId: number): CartOperationResult => {
    const item = items.find((cartItem) => cartItem.productId === productId)
    return item ? updateQuantity(productId, roundMoney(item.quantity + 1)) : { success: false }
  }, [items, updateQuantity])

  const decreaseQuantity = useCallback((productId: number): CartOperationResult => {
    const item = items.find((cartItem) => cartItem.productId === productId)

    if (!item) {
      return { success: false }
    }

    if (item.quantity <= 1) {
      setItems((currentItems) => currentItems.filter((cartItem) => cartItem.productId !== productId))
      return { success: true }
    }

    return updateQuantity(productId, roundMoney(item.quantity - 1))
  }, [items, updateQuantity])

  const removeProduct = useCallback((productId: number) => {
    setItems((currentItems) => currentItems.filter((item) => item.productId !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const total = useMemo(
    () => roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0)),
    [items],
  )

  const totalUnits = useMemo(
    () => roundMoney(items.reduce((sum, item) => sum + item.quantity, 0)),
    [items],
  )

  return {
    addProduct,
    clearCart,
    decreaseQuantity,
    hasItems: items.length > 0,
    increaseQuantity,
    items,
    removeProduct,
    total,
    totalUnits,
    updateQuantity,
  }
}
