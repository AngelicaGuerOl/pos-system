import { useState } from 'react'
import { normalizeApiError, type NormalizedApiError } from '../../../../../shared/api/apiError'
import { categoryDependencies } from '../../dependencies'
import type { Category, CategoryMutation } from '../../domain/entities/Category'

export const useCreateCategory = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<NormalizedApiError | null>(null)

  const createCategory = async (data: CategoryMutation): Promise<Category | null> => {
    setLoading(true)
    setError(null)

    try {
      return await categoryDependencies.createCategoryUseCase.execute(data)
    } catch (unknownError) {
      setError(normalizeApiError(unknownError))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createCategory, error, loading }
}

