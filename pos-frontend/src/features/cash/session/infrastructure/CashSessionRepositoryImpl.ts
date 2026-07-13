import type { AxiosInstance } from 'axios'
import type { CashSession, OpenCashSessionData } from '../domain/entities/CashSession'
import type { CashSessionRepository } from '../domain/repositories/CashSessionRepository'
import {
  CashSessionMapper,
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

  async open(data: OpenCashSessionData): Promise<CashSession> {
    const response = await this.client.post<BackendCashSessionResponse>(
      '/cash-sessions/open',
      CashSessionMapper.toRequest(data),
    )

    return CashSessionMapper.toEntity(response.data)
  }
}
