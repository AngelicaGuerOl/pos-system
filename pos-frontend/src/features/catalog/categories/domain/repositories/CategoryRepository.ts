import type { Category, CategoryMutation } from '../entities/Category'

export type CategoryRepository = {
  getAll(search?: string): Promise<Category[]>
  getById(id: number): Promise<Category>
  create(data: CategoryMutation): Promise<Category>
  update(id: number, data: CategoryMutation): Promise<Category>
  deactivate(id: number): Promise<void>
}

