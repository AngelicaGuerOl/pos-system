import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../../shared/types/PageResponse'
import { toEndOfDayISOString, toStartOfDayISOString } from '../../../../shared/utils/dateFilters'
import type {
  InventoryMovement,
  InventoryMovementFilters,
  ManualInventoryMovementData,
} from '../domain/entities/InventoryMovement'
import type { InventoryMovementRepository } from '../domain/repositories/InventoryMovementRepository'
import {
  InventoryMovementMapper,
  type BackendInventoryMovementResponse,
} from './mappers/InventoryMovementMapper'

export class InventoryMovementRepositoryImpl implements InventoryMovementRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async createEntry(data: ManualInventoryMovementData): Promise<InventoryMovement> {
    const response = await this.client.post<BackendInventoryMovementResponse>(
      '/inventory-movements/entries',
      InventoryMovementMapper.toRequest(data),
    )

    return InventoryMovementMapper.toEntity(response.data)
  }

  async createExit(data: ManualInventoryMovementData): Promise<InventoryMovement> {
    const response = await this.client.post<BackendInventoryMovementResponse>(
      '/inventory-movements/exits',
      InventoryMovementMapper.toRequest(data),
    )

    return InventoryMovementMapper.toEntity(response.data)
  }

  async getAll(filters: InventoryMovementFilters): Promise<PageResponse<InventoryMovement>> {
    const { data } = await this.client.get<PageResponse<BackendInventoryMovementResponse>>(
      '/inventory-movements',
      {
        params: {
          search: filters.search?.trim() || undefined,
          productId: filters.productId || undefined,
          direction: filters.direction || undefined,
          type: filters.type || undefined,
          from: toStartOfDayISOString(filters.from),
          to: toEndOfDayISOString(filters.to),
          page: filters.page,
          size: filters.size,
          sort: filters.sort ?? 'createdAt,DESC',
        },
      },
    )

    return InventoryMovementMapper.toPage(data)
  }

  async getById(id: number): Promise<InventoryMovement> {
    const { data } = await this.client.get<BackendInventoryMovementResponse>(
      `/inventory-movements/${id}`,
    )

    return InventoryMovementMapper.toEntity(data)
  }

  async getByProduct(
    productId: number,
    page: number,
    size: number,
    sort = 'createdAt,DESC',
  ): Promise<PageResponse<InventoryMovement>> {
    const { data } = await this.client.get<PageResponse<BackendInventoryMovementResponse>>(
      `/products/${productId}/inventory-movements`,
      {
        params: {
          page,
          size,
          sort,
        },
      },
    )

    return InventoryMovementMapper.toPage(data)
  }
}
