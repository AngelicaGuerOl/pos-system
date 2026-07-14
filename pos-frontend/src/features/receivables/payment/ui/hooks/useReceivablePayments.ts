import { useCallback, useEffect, useMemo, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { receivableDependencies } from '../../../dependencies'
import type {
  ReceivablePayment,
  ReceivablePaymentFilters,
} from '../../domain/entities/ReceivablePayment'

const INITIAL_FILTERS: ReceivablePaymentFilters = {
  page: 0,
  size: 5,
  sort: 'createdAt,DESC',
}

export const useReceivablePayments = (receivableId: number | null) => {
  const [payments, setPayments] = useState<ReceivablePayment[]>([])
  const [filters, setFilters] = useState<ReceivablePaymentFilters>(INITIAL_FILTERS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const requestFilters = useMemo(() => filters, [filters])

  const fetchPayments = useCallback(async (
    nextFilters: ReceivablePaymentFilters = requestFilters,
  ) => {
    if (!receivableId) {
      setPayments([])
      setTotalElements(0)
      setTotalPages(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const page = await receivableDependencies.getReceivablePaymentsUseCase.execute(
        receivableId,
        nextFilters,
      )
      setPayments(page.content)
      setTotalElements(page.totalElements)
      setTotalPages(page.totalPages)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [receivableId, requestFilters])

  useEffect(() => {
    void fetchPayments(requestFilters)
  }, [fetchPayments, requestFilters])

  const setPage = useCallback((page: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page,
    }))
  }, [])

  const setSize = useCallback((size: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: 0,
      size,
    }))
  }, [])

  return {
    error,
    loading,
    page: filters.page,
    payments,
    refetch: fetchPayments,
    setPage,
    setSize,
    size: filters.size,
    totalElements,
    totalPages,
  }
}
