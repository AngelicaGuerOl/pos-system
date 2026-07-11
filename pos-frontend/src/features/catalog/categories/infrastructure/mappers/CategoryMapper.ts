import type { Category, CategoryMutation } from '../../domain/entities/Category'

export type BackendCategoryResponse = {
  id: number
  name: string
  description: string | null
  active: boolean
  createdAt: string
  updatedAt: string | null
}

export type BackendCategoryRequest = {
  name: string
  description?: string | null
}

export const CategoryMapper = {
  toEntity(response: BackendCategoryResponse): Category {
    return {
      id: response.id,
      name: response.name,
      description: response.description,
      active: response.active,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    }
  },

  toEntityList(response: BackendCategoryResponse[]): Category[] {
    return response.map((category) => CategoryMapper.toEntity(category))
  },

  toRequest(data: CategoryMutation): BackendCategoryRequest {
    return {
      name: data.name.trim(),
      description: data.description?.trim() || null,
    }
  },
}

