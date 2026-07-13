import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type {
  InventoryMovement,
  InventoryMovementDirection,
  InventoryMovementType,
  ManualInventoryMovementData,
} from '../../domain/entities/InventoryMovement'

export type BackendInventoryMovementResponse = {
  id: number
  productId: number
  productBarcode: string
  productName: string
  productUnit: string
  createdById: number
  createdByUsername: string
  direction: InventoryMovementDirection
  type: InventoryMovementType
  quantity: number
  previousStock: number
  newStock: number
  description: string
  sourceType: string | null
  sourceId: number | null
  createdAt: string
}

export type BackendManualInventoryMovementRequest = {
  productId: number
  quantity: number
  description: string
}

export const InventoryMovementMapper = {
  toEntity(response: BackendInventoryMovementResponse): InventoryMovement {
    return {
      id: response.id,
      productId: response.productId,
      productBarcode: response.productBarcode,
      productName: response.productName,
      productUnit: response.productUnit,
      createdById: response.createdById,
      createdByUsername: response.createdByUsername,
      direction: response.direction,
      type: response.type,
      quantity: Number(response.quantity),
      previousStock: Number(response.previousStock),
      newStock: Number(response.newStock),
      description: response.description,
      sourceType: response.sourceType,
      sourceId: response.sourceId,
      createdAt: response.createdAt,
    }
  },

  toPage(response: PageResponse<BackendInventoryMovementResponse>): PageResponse<InventoryMovement> {
    return {
      ...response,
      content: response.content.map(InventoryMovementMapper.toEntity),
    }
  },

  toRequest(data: ManualInventoryMovementData): BackendManualInventoryMovementRequest {
    return {
      productId: data.productId,
      quantity: data.quantity,
      description: data.description.trim(),
    }
  },
}
