import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type {
  SupplierSettlement,
  SupplierSettlementCreateMutation,
  SupplierSettlementUpdateMutation,
} from '../../domain/entities/SupplierSettlement'

export type BackendSupplierSettlementResponse = SupplierSettlement

export const SupplierSettlementMapper = {
  toEntity(response: BackendSupplierSettlementResponse): SupplierSettlement {
    return {
      ...response,
      openingInventoryValue: Number(response.openingInventoryValue),
      entriesSaleValue: Number(response.entriesSaleValue),
      availableInventoryValue: Number(response.availableInventoryValue),
      closingInventoryValue: Number(response.closingInventoryValue),
      expectedAmount: Number(response.expectedAmount),
      deliveredAmount: response.deliveredAmount === null ? null : Number(response.deliveredAmount),
      differenceAmount: response.differenceAmount === null ? null : Number(response.differenceAmount),
      historicalImport: Boolean(response.historicalImport),
      sourceFile: response.sourceFile ?? null,
      sourceSheet: response.sourceSheet ?? null,
      items: response.items.map((item) => ({
        ...item,
        openingQuantity: Number(item.openingQuantity),
        openingSalePrice: Number(item.openingSalePrice),
        openingValue: Number(item.openingValue),
        receivedQuantity: Number(item.receivedQuantity),
        receivedSaleValue: Number(item.receivedSaleValue),
        availableQuantity: Number(item.availableQuantity),
        closingQuantity: item.closingQuantity === null ? null : Number(item.closingQuantity),
        closingSalePrice: Number(item.closingSalePrice),
        closingValue: Number(item.closingValue),
        quantityToJustify: Number(item.quantityToJustify),
        expectedAmount: Number(item.expectedAmount),
      })),
    }
  },

  toPage(response: PageResponse<BackendSupplierSettlementResponse>): PageResponse<SupplierSettlement> {
    return { ...response, content: response.content.map((settlement) => SupplierSettlementMapper.toEntity(settlement)) }
  },

  toCreateRequest(data: SupplierSettlementCreateMutation): SupplierSettlementCreateMutation {
    return { periodEnd: data.periodEnd, supplierId: data.supplierId }
  },

  toUpdateRequest(data: SupplierSettlementUpdateMutation): SupplierSettlementUpdateMutation {
    return {
      deliveredAmount: data.deliveredAmount ?? null,
      notes: data.notes?.trim() || null,
      items: data.items.map((item) => ({
        productId: item.productId,
        closingQuantity: item.closingQuantity,
        closingSalePrice: item.closingSalePrice,
      })),
    }
  },
}
