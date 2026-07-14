import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth'
import { useCashSession } from '../../../cash/session'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { ROUTE_PATHS } from '../../../../shared/routes/routePaths'
import { saleDependencies } from '../../dependencies'
import type { SaleHistoryFilters, SaleSummary } from '../../domain/entities/Sale'

const INITIAL_FILTERS: SaleHistoryFilters = {
  page: 0,
  size: 10,
  sort: 'createdAt,DESC',
}

const FOLIO_DEBOUNCE_MS = 300

const cleanFilters = (filters: SaleHistoryFilters): SaleHistoryFilters => ({
  ...filters,
  id: filters.id || undefined,
  folio: filters.folio || undefined,
  customerId: filters.customerId || undefined,
  createdByUserId: filters.createdByUserId || undefined,
  status: filters.status || undefined,
  saleType: filters.saleType || undefined,
  from: filters.from || undefined,
  to: filters.to || undefined,
})

export const useSalesHistory = () => {
  const { user } = useAuth()
  const { refreshCurrentSession } = useCashSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [sales, setSales] = useState<SaleSummary[]>([])
  const [filters, setFilters] = useState<SaleHistoryFilters>(INITIAL_FILTERS)
  const [debouncedFolio, setDebouncedFolio] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedFolio(filters.folio)
    }, FOLIO_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [filters.folio])

  const requestFilters = useMemo<SaleHistoryFilters>(
    () =>
      cleanFilters({
        ...filters,
        folio: debouncedFolio,
      }),
    [debouncedFolio, filters],
  )

  const fetchSales = useCallback(
    async (nextFilters: SaleHistoryFilters = requestFilters) => {
      if (!user) {
        return
      }

      if (nextFilters.from && nextFilters.to && nextFilters.from > nextFilters.to) {
        setError({ message: 'La fecha inicial no debe ser posterior a la fecha final' })
        return
      }

      setLoading(true)
      setError(null)

      try {
        const page = isAdmin
          ? await saleDependencies.getSalesHistoryUseCase.execute(nextFilters)
          : await saleDependencies.getCurrentSessionSalesUseCase.execute(nextFilters)

        setSales(page.content)
        setTotalElements(page.totalElements)
        setTotalPages(page.totalPages)
      } catch (unknownError) {
        const normalizedError = normalizeApiError(unknownError)
        setError(normalizedError)

        if (!isAdmin && normalizedError.status === 409) {
          await refreshCurrentSession()
          navigate(ROUTE_PATHS.cashSessionOpen, {
            replace: true,
            state: { from: location },
          })
        }
      } finally {
        setLoading(false)
      }
    },
    [isAdmin, location, navigate, refreshCurrentSession, requestFilters, user],
  )

  useEffect(() => {
    void fetchSales(requestFilters)
  }, [fetchSales, requestFilters])

  const updateFilters = useCallback((nextFilters: Partial<SaleHistoryFilters>) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
      page: 0,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS)
    setDebouncedFolio(undefined)
  }, [])

  const setPage = useCallback((nextPage: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: nextPage,
    }))
  }, [])

  const setSize = useCallback((nextSize: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: 0,
      size: nextSize,
    }))
  }, [])

  return {
    clearFilters,
    error,
    filters,
    isAdmin,
    loading,
    page: filters.page,
    refetch: fetchSales,
    sales,
    setFilters: updateFilters,
    setPage,
    setSize,
    size: filters.size,
    totalElements,
    totalPages,
  }
}
