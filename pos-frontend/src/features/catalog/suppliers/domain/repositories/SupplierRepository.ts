import type { PageResponse } from '../../../../../shared/types/PageResponse'
import type {
  Supplier,
  SupplierFilters,
  SupplierInventoryBaseline,
  SupplierInventoryBaselineMutation,
  SupplierMutation,
  SupplierProductsPage,
} from '../entities/Supplier'

export type SupplierRepository = {
  getAll(filters?: SupplierFilters): Promise<PageResponse<Supplier>>
  getById(id: number): Promise<Supplier>
  create(data: SupplierMutation): Promise<Supplier>
  update(id: number, data: SupplierMutation): Promise<Supplier>
  deactivate(id: number): Promise<void>
  getProducts(supplierId: number, filters?: { search?: string; page?: number; size?: number; sort?: string }): Promise<SupplierProductsPage>
  getInventoryBaseline(supplierId: number): Promise<SupplierInventoryBaseline>
  createInventoryBaseline(
    supplierId: number,
    data: SupplierInventoryBaselineMutation,
  ): Promise<SupplierInventoryBaseline>
}
