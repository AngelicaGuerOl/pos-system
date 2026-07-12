import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../shared/api/apiError'
import { userDependencies } from '../../dependencies'
import type { User, UserFilters } from '../../domain/entities/User'

const INITIAL_FILTERS: Required<Pick<UserFilters, 'page' | 'size' | 'sort'>> = {
  page: 0,
  size: 10,
  sort: 'username,asc',
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [filters, setFilters] = useState<UserFilters>(INITIAL_FILTERS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(INITIAL_FILTERS.page)
  const [size, setSize] = useState(INITIAL_FILTERS.size)

  const fetchUsers = useCallback(async (nextFilters: UserFilters = filters) => {
    setLoading(true)
    setError(null)

    try {
      const data = await userDependencies.getUsersUseCase.execute(nextFilters)
      setUsers(data.content)
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
      void fetchUsers(filters)
    }, 300)

    return () => window.clearTimeout(debounceId)
  }, [fetchUsers, filters])

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
    error,
    filters,
    loading,
    page,
    refetch: fetchUsers,
    setPage: setPageFilter,
    setSearch,
    setSize: setSizeFilter,
    size,
    totalElements,
    totalPages,
    users,
  }
}
