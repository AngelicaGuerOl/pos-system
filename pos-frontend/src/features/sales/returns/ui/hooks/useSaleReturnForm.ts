import { useCallback, useMemo, useState } from 'react'
import type { Sale, SaleItem } from '../../../domain/entities/Sale'
import type { CreateSaleReturnRequest } from '../../domain/entities/SaleReturn'
import { getInitialReturnQuantity } from '../utils/returnQuantity'

type ReturnFormState = {
  quantities: Record<number, number>
  reason: string
  selectedIds: Set<number>
}

const emptyReturnForm = (): ReturnFormState => ({
  quantities: {},
  reason: '',
  selectedIds: new Set(),
})

export const useSaleReturnForm = (sale: Sale | null) => {
  const [form, setForm] = useState<ReturnFormState>(() => emptyReturnForm())
  const [formError, setFormError] = useState<string | null>(null)

  const returnableItems = useMemo(
    () => sale?.items.filter((item) => item.returnableQuantity > 0) ?? [],
    [sale],
  )

  const selectedItems = useMemo(
    () => returnableItems.filter((item) => form.selectedIds.has(item.id)),
    [form.selectedIds, returnableItems],
  )

  const returnSummary = useMemo(() => {
    return selectedItems.reduce(
      (summary, item) => {
        const quantity = form.quantities[item.id] ?? 0
        return {
          itemCount: summary.itemCount + 1,
          total: summary.total + quantity * item.unitPrice,
          units: summary.units + quantity,
        }
      },
      { itemCount: 0, total: 0, units: 0 },
    )
  }, [form.quantities, selectedItems])

  const estimatedCreditBalance = sale?.receivable
    ? Math.max(sale.receivable.outstandingBalance - returnSummary.total, 0)
    : null

  const resetReturnForm = useCallback(() => {
    setForm(emptyReturnForm())
    setFormError(null)
  }, [])

  const toggleItem = useCallback((item: SaleItem, checked: boolean) => {
    if (item.returnableQuantity <= 0) {
      return
    }

    setForm((current) => {
      const selectedIds = new Set(current.selectedIds)
      const quantities = { ...current.quantities }
      if (checked) {
        selectedIds.add(item.id)
        quantities[item.id] = quantities[item.id] || getInitialReturnQuantity(item)
      } else {
        selectedIds.delete(item.id)
        quantities[item.id] = 0
      }

      return {
        ...current,
        quantities,
        selectedIds,
      }
    })
    setFormError(null)
  }, [])

  const changeQuantity = useCallback((item: SaleItem, quantity: number) => {
    setForm((current) => ({
      ...current,
      quantities: {
        ...current.quantities,
        [item.id]: quantity,
      },
    }))
  }, [])

  const changeReason = useCallback((reason: string) => {
    setForm((current) => ({
      ...current,
      reason: reason.slice(0, 255),
    }))
  }, [])

  const buildRequest = useCallback((): CreateSaleReturnRequest | null => {
    const reason = form.reason.trim()
    if (selectedItems.length === 0) {
      setFormError('Selecciona al menos un artículo para devolver.')
      return null
    }
    if (reason.length < 3) {
      setFormError('Ingresa el motivo de la devolución.')
      return null
    }

    const items = selectedItems.map((item) => ({
      saleItemId: item.id,
      quantity: form.quantities[item.id] ?? 0,
    }))

    if (items.some((item) => item.quantity <= 0)) {
      setFormError('Revisa las cantidades seleccionadas.')
      return null
    }
    if (selectedItems.some((item) => (form.quantities[item.id] ?? 0) > item.returnableQuantity)) {
      setFormError('Hay cantidades que superan lo disponible para devolución.')
      return null
    }

    return { reason, items }
  }, [form.quantities, form.reason, selectedItems])

  return {
    buildRequest,
    changeQuantity,
    changeReason,
    estimatedCreditBalance,
    form,
    formError,
    resetReturnForm,
    returnableItems,
    returnSummary,
    selectedItems,
    setFormError,
    toggleItem,
  }
}
