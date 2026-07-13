import { httpClient } from '../../../shared/api/httpClient'
import { CreateInventoryEntryUseCase } from './application/useCases/CreateInventoryEntryUseCase'
import { CreateInventoryExitUseCase } from './application/useCases/CreateInventoryExitUseCase'
import { GetInventoryMovementByIdUseCase } from './application/useCases/GetInventoryMovementByIdUseCase'
import { GetInventoryMovementsUseCase } from './application/useCases/GetInventoryMovementsUseCase'
import { GetProductInventoryMovementsUseCase } from './application/useCases/GetProductInventoryMovementsUseCase'
import { InventoryMovementRepositoryImpl } from './infrastructure/InventoryMovementRepositoryImpl'

const inventoryMovementRepository = new InventoryMovementRepositoryImpl(httpClient)

export const inventoryMovementDependencies = {
  createInventoryEntryUseCase: new CreateInventoryEntryUseCase(inventoryMovementRepository),
  createInventoryExitUseCase: new CreateInventoryExitUseCase(inventoryMovementRepository),
  getInventoryMovementsUseCase: new GetInventoryMovementsUseCase(inventoryMovementRepository),
  getInventoryMovementByIdUseCase: new GetInventoryMovementByIdUseCase(inventoryMovementRepository),
  getProductInventoryMovementsUseCase: new GetProductInventoryMovementsUseCase(
    inventoryMovementRepository,
  ),
} as const
