import type {
  SupplierEntry,
  SupplierEntryFilters,
  SupplierEntryMutation,
  SupplierEntryPageResponse,
} from '../entities/SupplierEntry'

export type SupplierEntryRepository = {
  create(data: SupplierEntryMutation): Promise<SupplierEntry>
  getAll(filters?: SupplierEntryFilters): Promise<SupplierEntryPageResponse>
  getById(id: number): Promise<SupplierEntry>
}
