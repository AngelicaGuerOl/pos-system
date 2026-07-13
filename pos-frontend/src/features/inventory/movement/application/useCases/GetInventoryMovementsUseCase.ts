import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { InventoryMovement, InventoryMovementFilters } from '../../domain/entities/InventoryMovement'
import type { InventoryMovementRepository } from '../../domain/repositories/InventoryMovementRepository'

export class GetInventoryMovementsUseCase {
  private readonly inventoryMovementRepository: InventoryMovementRepository

  constructor(inventoryMovementRepository: InventoryMovementRepository) {
    this.inventoryMovementRepository = inventoryMovementRepository
  }

  execute(filters: InventoryMovementFilters): Promise<PageResponse<InventoryMovement>> {
    return this.inventoryMovementRepository.getAll(filters)
  }
}
