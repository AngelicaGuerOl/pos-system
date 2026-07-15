import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { saleDependencies } from '../../../dependencies'
import type { SaleReturnSummary } from '../../domain/entities/SaleReturn'

const INITIAL_SIZE = 5

export const useSaleReturns = (saleId: number | null) => {
  const [returns, setReturns] = useState<SaleReturnSummary[]>([])
  const [page, setPage] = useState(0)
  const [size, setSizeState] = useState(INITIAL_SIZE)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const refetch = useCallback(async () => {
    if (!saleId) {
      setReturns([])
      setTotalElements(0)
      setTotalPages(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await saleDependencies.getSaleReturnsUseCase.execute(saleId, {
        page,
        size,
        sort: 'createdAt,DESC',
      })
      setReturns(data.content)
      setTotalElements(data.totalElements)
      setTotalPages(data.totalPages)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [page, saleId, size])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const setSize = useCallback((nextSize: number) => {
    setPage(0)
    setSizeState(nextSize)
  }, [])

  return {
    error,
    loading,
    page,
    refetch,
    returns,
    setPage,
    setSize,
    size,
    totalElements,
    totalPages,
  }
}
