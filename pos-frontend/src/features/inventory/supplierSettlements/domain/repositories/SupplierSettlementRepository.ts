import type {
  SupplierSettlement,
  SupplierSettlementCreateMutation,
  SupplierSettlementFilters,
  SupplierSettlementUpdateMutation,
  SupplierSettlementPageResponse,
} from '../entities/SupplierSettlement'

export type ExportedSupplierSettlement = {
  blob: Blob
  filename: string
}

export type SupplierSettlementRepository = {
  create(data: SupplierSettlementCreateMutation): Promise<SupplierSettlement>
  update(id: number, data: SupplierSettlementUpdateMutation): Promise<SupplierSettlement>
  finalize(id: number): Promise<SupplierSettlement>
  getAll(filters?: SupplierSettlementFilters): Promise<SupplierSettlementPageResponse>
  getById(id: number): Promise<SupplierSettlement>
  exportSettlement(id: number): Promise<ExportedSupplierSettlement>
}
