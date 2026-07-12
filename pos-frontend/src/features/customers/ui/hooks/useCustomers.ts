import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { customerDependencies } from '../../dependencies'
import type { Customer, CustomerFilters } from '../../domain/entities/Customer'

const INITIAL_FILTERS: Required<Pick<CustomerFilters, 'page' | 'size' | 'sort'>> = {
  page: 0,
  size: 10,
  sort: 'firstName,asc',
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filters, setFilters] = useState<CustomerFilters>(INITIAL_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(INITIAL_FILTERS.page)
  const [size, setSize] = useState(INITIAL_FILTERS.size)

  const fetchCustomers = useCallback(async (nextFilters: CustomerFilters = filters) => {
    setLoading(true)
    setError(null)

    try {
      const data = await customerDependencies.getCustomersUseCase.execute(nextFilters)
      setCustomers(data.content)
      setPage(data.page)
      setSize(data.size)
      setTotalElements(data.totalElements)
      setTotalPages(data.totalPages)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const debounceId = window.setTimeout(() => {
      void fetchCustomers(filters)
    }, 300)

    return () => window.clearTimeout(debounceId)
  }, [fetchCustomers, filters])

  const updateFilters = useCallback((nextFilters: CustomerFilters) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
      page: nextFilters.search !== undefined ? 0 : nextFilters.page ?? currentFilters.page,
    }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      search,
      page: 0,
    }))
  }, [])

  const setPageFilter = useCallback((nextPage: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: nextPage,
    }))
  }, [])

  const setSizeFilter = useCallback((nextSize: number) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      page: 0,
      size: nextSize,
    }))
  }, [])

  return {
    customers,
    error,
    filters,
    loading,
    page,
    refetch: fetchCustomers,
    setFilters: updateFilters,
    setPage: setPageFilter,
    setSearch,
    setSize: setSizeFilter,
    size,
    totalElements,
    totalPages,
  }
}
