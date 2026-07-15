import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  CustomerReceivableFilters,
  Receivable,
  ReceivableFilters,
} from '../entities/Receivable'

export type ReceivableRepository = {
  getAll(filters: ReceivableFilters): Promise<PageResponse<Receivable>>
  getByCustomer(
    customerId: number,
    filters: CustomerReceivableFilters,
  ): Promise<PageResponse<Receivable>>
}
