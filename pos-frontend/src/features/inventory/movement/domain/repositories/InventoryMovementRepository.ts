import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type {
  InventoryMovement,
  InventoryMovementFilters,
  ManualInventoryMovementData,
} from '../entities/InventoryMovement'

export interface InventoryMovementRepository {
  createEntry(data: ManualInventoryMovementData): Promise<InventoryMovement>

  createExit(data: ManualInventoryMovementData): Promise<InventoryMovement>

  getAll(filters: InventoryMovementFilters): Promise<PageResponse<InventoryMovement>>

  getById(id: number): Promise<InventoryMovement>

  getByProduct(
    productId: number,
    page: number,
    size: number,
    sort?: string,
  ): Promise<PageResponse<InventoryMovement>>
}
