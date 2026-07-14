import type { ReceivableDetail } from '../../domain/entities/Receivable'
import type { ReceivableRepository } from '../../domain/repositories/ReceivableRepository'

export class GetReceivableByIdUseCase {
  private readonly receivableRepository: ReceivableRepository

  constructor(receivableRepository: ReceivableRepository) {
    this.receivableRepository = receivableRepository
  }

  execute(id: number): Promise<ReceivableDetail> {
    return this.receivableRepository.getById(id)
  }
}
