import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { InventoryMovement } from '../../domain/entities/InventoryMovement'
import type { InventoryMovementRepository } from '../../domain/repositories/InventoryMovementRepository'

export class GetProductInventoryMovementsUseCase {
  private readonly inventoryMovementRepository: InventoryMovementRepository

  constructor(inventoryMovementRepository: InventoryMovementRepository) {
    this.inventoryMovementRepository = inventoryMovementRepository
  }

  execute(
    productId: number,
    page: number,
    size: number,
    sort?: string,
  ): Promise<PageResponse<InventoryMovement>> {
    return this.inventoryMovementRepository.getByProduct(productId, page, size, sort)
  }
}
