import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  CreateReceivablePaymentRequest,
  ReceivablePayment,
  ReceivablePaymentFilters,
} from '../domain/entities/ReceivablePayment'
import type { ReceivablePaymentRepository } from '../domain/repositories/ReceivablePaymentRepository'
import {
  ReceivablePaymentMapper,
  type BackendReceivablePaymentResponse,
} from './mappers/ReceivablePaymentMapper'

export class ReceivablePaymentRepositoryImpl implements ReceivablePaymentRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async createPayment(
    receivableId: number,
    request: CreateReceivablePaymentRequest,
  ): Promise<ReceivablePayment> {
    const { data } = await this.client.post<BackendReceivablePaymentResponse>(
      `/receivables/${receivableId}/payments`,
      ReceivablePaymentMapper.toRequest(request),
    )

    return ReceivablePaymentMapper.toEntity(data)
  }

  async getPaymentsByReceivable(
    receivableId: number,
    filters: ReceivablePaymentFilters,
  ): Promise<PageResponse<ReceivablePayment>> {
    const { data } = await this.client.get<PageResponse<BackendReceivablePaymentResponse>>(
      `/receivables/${receivableId}/payments`,
      {
        params: ReceivablePaymentMapper.toParams(filters),
      },
    )

    return ReceivablePaymentMapper.toPage(data)
  }

  async getPaymentById(paymentId: number): Promise<ReceivablePayment> {
    const { data } = await this.client.get<BackendReceivablePaymentResponse>(
      `/receivable-payments/${paymentId}`,
    )

    return ReceivablePaymentMapper.toEntity(data)
  }
}
