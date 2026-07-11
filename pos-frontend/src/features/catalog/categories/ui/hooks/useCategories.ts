import { useCallback, useEffect, useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { categoryDependencies } from '../../dependencies'
import type { Category } from '../../domain/entities/Category'

export const useCategories = (initialSearch = '') => {
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState(initialSearch)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const fetchCategories = useCallback(async (nextSearch = search) => {
    setLoading(true)
    setError(null)

    try {
      const data = await categoryDependencies.getCategoriesUseCase.execute(nextSearch)
      setCategories(data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    void fetchCategories(initialSearch)
  }, [fetchCategories, initialSearch])

  return {
    categories,
    error,
    loading,
    search,
    setSearch,
    refetch: fetchCategories,
  }
}

