import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type { SupplierEntry, SupplierEntryMutation } from '../../domain/entities/SupplierEntry'

export type BackendSupplierEntryResponse = SupplierEntry

export const SupplierEntryMapper = {
  toEntity(response: BackendSupplierEntryResponse): SupplierEntry {
    return {
      ...response,
      id: response.id ?? null,
      entryType: response.entryType ?? 'SUPPLIER_PURCHASE',
      supplierId: response.supplierId ?? null,
      supplierName: response.supplierName ?? null,
      totalCost: Number(response.totalCost),
      totalSaleValue: Number(response.totalSaleValue),
      historicalImport: response.historicalImport ?? false,
      sourceFile: response.sourceFile ?? null,
      sourceSheet: response.sourceSheet ?? null,
      items: (response.items ?? []).map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        costKnown: item.costKnown ?? true,
        salePrice: Number(item.salePrice),
        costSubtotal: Number(item.costSubtotal),
        saleValueSubtotal: Number(item.saleValueSubtotal),
      })),
    }
  },

  toPage(response: PageResponse<BackendSupplierEntryResponse>): PageResponse<SupplierEntry> {
    return { ...response, content: response.content.map((entry) => SupplierEntryMapper.toEntity(entry)) }
  },

  toRequest(data: SupplierEntryMutation): SupplierEntryMutation {
    return {
      supplierId: data.supplierId,
      entryType: data.entryType,
      entryDate: data.entryDate,
      notes: data.notes?.trim() || null,
      items: data.items.map((item) => ({
        productId: item.productId,
        newProduct: item.newProduct ?? null,
        quantity: item.quantity,
        unitCost: item.unitCost,
        salePrice: item.salePrice,
      })),
    }
  },
}
