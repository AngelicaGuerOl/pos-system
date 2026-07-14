import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  CustomerReceivableFilters,
  Receivable,
  ReceivableDetail,
  ReceivableFilters,
} from '../entities/Receivable'

export type ReceivableRepository = {
  getAll(filters: ReceivableFilters): Promise<PageResponse<Receivable>>
  getById(id: number): Promise<ReceivableDetail>
  getByCustomer(
    customerId: number,
    filters: CustomerReceivableFilters,
  ): Promise<PageResponse<Receivable>>
}
