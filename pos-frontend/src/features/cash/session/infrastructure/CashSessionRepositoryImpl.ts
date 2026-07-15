import type { AxiosInstance } from 'axios'
import type { PageResponse } from '../../../../shared/types/PageResponse'
import type {
  CashSession,
  CashSessionClosingSummary,
  CashSessionFilters,
  CloseCashSessionData,
  OpenCashSessionData,
} from '../domain/entities/CashSession'
import type { CashSessionRepository } from '../domain/repositories/CashSessionRepository'
import {
  CashSessionMapper,
  type BackendCashSessionClosingSummaryResponse,
  type BackendCashSessionResponse,
} from './mappers/CashSessionMapper'

export class CashSessionRepositoryImpl implements CashSessionRepository {
  private readonly client: AxiosInstance

  constructor(client: AxiosInstance) {
    this.client = client
  }

  async getCurrent(): Promise<CashSession | null> {
    const response = await this.client.get<BackendCashSessionResponse | null>(
      '/cash-sessions/current',
    )

    if (response.status === 204 || !response.data) {
      return null
    }

    return CashSessionMapper.toEntity(response.data)
  }

  async getCurrentClosingPreview(): Promise<CashSessionClosingSummary> {
    const { data } = await this.client.get<BackendCashSessionClosingSummaryResponse>(
      '/cash-sessions/current/closing-preview',
    )

    return CashSessionMapper.toClosingSummary(data)
  }

  async closeCurrent(data: CloseCashSessionData): Promise<CashSessionClosingSummary> {
    const response = await this.client.post<BackendCashSessionClosingSummaryResponse>(
      '/cash-sessions/current/close',
      CashSessionMapper.toCloseRequest(data),
    )

    return CashSessionMapper.toClosingSummary(response.data)
  }

  async getClosingSummary(sessionId: number): Promise<CashSessionClosingSummary> {
    const { data } = await this.client.get<BackendCashSessionClosingSummaryResponse>(
      `/cash-sessions/${sessionId}/closing-summary`,
    )

    return CashSessionMapper.toClosingSummary(data)
  }

  async getAll(filters: CashSessionFilters = {}): Promise<PageResponse<CashSession>> {
    const { data } = await this.client.get<PageResponse<BackendCashSessionResponse>>(
      '/cash-sessions',
      {
        params: CashSessionMapper.toFiltersParams(filters),
      },
    )

    return CashSessionMapper.toPage(data)
  }

  async open(data: OpenCashSessionData): Promise<CashSession> {
    const response = await this.client.post<BackendCashSessionResponse>(
      '/cash-sessions/open',
      CashSessionMapper.toRequest(data),
    )

    return CashSessionMapper.toEntity(response.data)
  }
}
