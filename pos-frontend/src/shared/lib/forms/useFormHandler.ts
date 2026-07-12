import { useCallback, useState } from 'react'
import { extractApiErrors } from './extractApiErrors'

type MutationResult = unknown
type MutationId = number
type SaveMode = 'create' | 'update'
type NotifyVariant = 'success' | 'error'

type Notify = (message: string, variant: NotifyVariant) => void

type Options<TData, TResult extends MutationResult = MutationResult> = {
  create: (data: TData) => Promise<TResult>
  update: (id: MutationId, data: TData) => Promise<TResult>
  getId?: (data: TData) => MutationId | null | undefined
  isSuccess?: (result: TResult) => boolean
  mapErrors?: Record<string, string>
  notify?: Notify
  onSuccess?: (result: TResult, mode: SaveMode) => void | Promise<void>
  entityLabel?: string
}

const defaultIsSuccess = <TResult extends MutationResult>(result: TResult) => result !== null

export function useFormHandler<TData, TResult extends MutationResult = MutationResult>(
  options: Options<TData, TResult>,
) {
  const {
    create,
    update,
    getId = (data) => (data as { id?: MutationId }).id,
    isSuccess = defaultIsSuccess,
    mapErrors = {},
    notify,
    onSuccess,
    entityLabel = 'registro',
  } = options

  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const clearErrors = useCallback(() => setServerErrors({}), [])

  const onSave = useCallback(
    async (data: TData) => {
      const id = getId(data)
      const mode: SaveMode = id == null ? 'create' : 'update'

      setIsSubmitting(true)
      clearErrors()

      try {
        const result = id == null ? await create(data) : await update(id, data)

        if (!isSuccess(result)) {
          notify?.(`Error al guardar el ${entityLabel}. Por favor intente nuevamente.`, 'error')
          return false
        }

        notify?.(
          `${entityLabel} ${mode === 'update' ? 'actualizado' : 'creado'} correctamente`,
          'success',
        )

        await onSuccess?.(result, mode)
        return true
      } catch (error) {
        const { fieldErrors, globalMessage } = extractApiErrors(error, mapErrors)

        setServerErrors(fieldErrors)
        notify?.(
          globalMessage || `Error al guardar el ${entityLabel}. Por favor intente nuevamente.`,
          'error',
        )
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [clearErrors, create, entityLabel, getId, isSuccess, mapErrors, notify, onSuccess, update],
  )

  return { onSave, serverErrors, clearErrors, isSubmitting }
}
