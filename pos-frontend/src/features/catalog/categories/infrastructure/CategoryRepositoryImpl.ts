import type { AxiosInstance } from 'axios'
import type { Category, CategoryMutation } from '../domain/entities/Category'
import type { CategoryRepository } from '../domain/repositories/CategoryRepository'
import {
  CategoryMapper,
  type BackendCategoryResponse,
} from './mappers/CategoryMapper'

export class CategoryRepositoryImpl implements CategoryRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async getAll(search?: string): Promise<Category[]> {
    const { data } = await this.client.get<BackendCategoryResponse[]>('/categories', {
      params: { search: search || undefined },
    })

    return CategoryMapper.toEntityList(data)
  }

  async getById(id: number): Promise<Category> {
    const { data } = await this.client.get<BackendCategoryResponse>(`/categories/${id}`)

    return CategoryMapper.toEntity(data)
  }

  async create(data: CategoryMutation): Promise<Category> {
    const response = await this.client.post<BackendCategoryResponse>(
      '/categories',
      CategoryMapper.toRequest(data),
    )

    return CategoryMapper.toEntity(response.data)
  }

  async update(id: number, data: CategoryMutation): Promise<Category> {
    const response = await this.client.put<BackendCategoryResponse>(
      `/categories/${id}`,
      CategoryMapper.toRequest(data),
    )

    return CategoryMapper.toEntity(response.data)
  }

  async deactivate(id: number): Promise<void> {
    await this.client.patch(`/categories/${id}/deactivate`)
  }
}

