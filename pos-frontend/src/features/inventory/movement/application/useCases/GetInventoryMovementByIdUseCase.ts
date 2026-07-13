import type { InventoryMovement } from '../../domain/entities/InventoryMovement'
import type { InventoryMovementRepository } from '../../domain/repositories/InventoryMovementRepository'

export class GetInventoryMovementByIdUseCase {
  private readonly inventoryMovementRepository: InventoryMovementRepository

  constructor(inventoryMovementRepository: InventoryMovementRepository) {
    this.inventoryMovementRepository = inventoryMovementRepository
  }

  execute(id: number): Promise<InventoryMovement> {
    return this.inventoryMovementRepository.getById(id)
  }
}
