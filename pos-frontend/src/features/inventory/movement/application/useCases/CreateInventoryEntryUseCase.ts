import type { InventoryMovement, ManualInventoryMovementData } from '../../domain/entities/InventoryMovement'
import type { InventoryMovementRepository } from '../../domain/repositories/InventoryMovementRepository'

export class CreateInventoryEntryUseCase {
  private readonly inventoryMovementRepository: InventoryMovementRepository

  constructor(inventoryMovementRepository: InventoryMovementRepository) {
    this.inventoryMovementRepository = inventoryMovementRepository
  }

  execute(data: ManualInventoryMovementData): Promise<InventoryMovement> {
    return this.inventoryMovementRepository.createEntry(data)
  }
}
