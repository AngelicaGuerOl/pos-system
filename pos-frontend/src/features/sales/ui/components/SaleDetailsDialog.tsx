import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  type AlertColor,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '../../../../shared/routes/routePaths'
import { formatDateTime } from '../../../../shared/utils/formatters'
import { useCashSession } from '../../../cash/session'
import { type Sale } from '../../domain/entities/Sale'
import { useCreateSaleReturn } from '../../returns/ui/hooks/useCreateSaleReturn'
import { useSaleReturnForm } from '../../returns/ui/hooks/useSaleReturnForm'
import { useSaleReturnDetails } from '../../returns/ui/hooks/useSaleReturnDetails'
import { useSaleReturns } from '../../returns/ui/hooks/useSaleReturns'
import { SaleDetailsSummary, SaleReturnContextLine } from './details/SaleDetailsSummary'
import { SaleItemsTable } from './details/SaleItemsTable'
import { SaleReturnForm } from './details/SaleReturnForm'
import { SaleReturnsSection } from './details/SaleReturnsSection'

type SaleDetailsDialogProps = {
  errorMessage?: string
  loading: boolean
  onClose: () => void
  onReturnRegistered?: () => Promise<void> | void
  open: boolean
  sale: Sale | null
}

type DialogMode = 'DETAIL' | 'RETURN'

const isCashSessionError = (message: string): boolean => {
  const normalizedMessage = message.toLowerCase()
  return normalizedMessage.includes('caja') || normalizedMessage.includes('cash session')
}

export const SaleDetailsDialog = ({
  errorMessage,
  loading,
  onClose,
  onReturnRegistered,
  open,
  sale,
}: SaleDetailsDialogProps) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshCurrentSession } = useCashSession()
  const saleReturns = useSaleReturns(sale?.id ?? null)
  const createReturn = useCreateSaleReturn()
  const returnForm = useSaleReturnForm(sale)
  const returnDetails = useSaleReturnDetails()
  const resetCreateReturn = createReturn.reset
  const closeReturnDetails = returnDetails.closeDetails
  const resetReturnForm = returnForm.resetReturnForm
  const [dialogMode, setDialogMode] = useState<DialogMode>('DETAIL')
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)
  const [autoExpandReturnId, setAutoExpandReturnId] = useState<number | null>(null)

  useEffect(() => {
    if (!open) {
      setDialogMode('DETAIL')
      setAutoExpandReturnId(null)
      resetReturnForm()
      resetCreateReturn()
      closeReturnDetails()
    }
  }, [closeReturnDetails, open, resetCreateReturn, resetReturnForm])

  const canRegisterReturn = Boolean(
    sale
      && (sale.status === 'COMPLETED' || sale.status === 'PARTIALLY_RETURNED')
      && returnForm.returnableItems.length > 0
      && !loading
      && !createReturn.loading,
  )

  const canConfirmReturn = Boolean(
    returnForm.selectedItems.length > 0
      && returnForm.form.reason.trim().length >= 3
      && returnForm.selectedItems.every((item) => {
        const quantity = returnForm.form.quantities[item.id] ?? 0
        return quantity > 0 && quantity <= item.returnableQuantity
      })
      && !createReturn.loading,
  )

  const handleClose = () => {
    resetReturnForm()
    createReturn.reset()
    setDialogMode('DETAIL')
    setAutoExpandReturnId(null)
    onClose()
  }

  const handleStartReturn = () => {
    resetReturnForm()
    createReturn.reset()
    setAutoExpandReturnId(null)
    setDialogMode('RETURN')
  }

  const handleCancelReturn = () => {
    resetReturnForm()
    createReturn.reset()
    setAutoExpandReturnId(null)
    setDialogMode('DETAIL')
  }

  const handleConfirmReturn = async () => {
    if (!sale) {
      return
    }

    const request = returnForm.buildRequest()
    if (!request) {
      return
    }

    const estimatedCreditRefund = sale.saleType === 'CREDIT'
      && sale.receivable
      && sale.receivable.paidAmount > Math.max(sale.receivable.adjustedAmount - returnForm.returnSummary.total, 0)
    const requiresCashSession = sale.saleType === 'CASH' || estimatedCreditRefund
    if (requiresCashSession) {
      const session = await refreshCurrentSession()
      if (!session) {
        returnForm.setFormError('Debes abrir una caja para procesar el reembolso en efectivo.')
        navigate(ROUTE_PATHS.cashSessionOpen, {
          state: { from: location },
        })
        return
      }
    }

    const createdReturn = await createReturn.createReturn(sale.id, request)
    if (!createdReturn) {
      const error = createReturn.getLastError()
      if (error?.status === 409 && isCashSessionError(error.message)) {
        await refreshCurrentSession()
        returnForm.setFormError('Debes abrir una caja para procesar el reembolso en efectivo.')
        navigate(ROUTE_PATHS.cashSessionOpen, {
          state: { from: location },
        })
        return
      }
      returnForm.setFormError(error?.message ?? 'No se pudo registrar la devolución.')
      await onReturnRegistered?.()
      return
    }

    resetReturnForm()
    createReturn.reset()
    setDialogMode('DETAIL')
    setAutoExpandReturnId(createdReturn.id)
    await saleReturns.refetch()
    await refreshCurrentSession()
    await onReturnRegistered?.()
    setMessage({
      severity: 'success',
      text: 'Devolución registrada correctamente.',
    })
  }

  return (
    <>
      <Dialog
        fullScreen={fullScreen}
        fullWidth
        maxWidth="lg"
        onClose={handleClose}
        open={open}
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              maxHeight: '90vh',
            },
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900 }} variant="h6">
                {dialogMode === 'RETURN' && sale
                  ? `Devolver artículos — Venta #${sale.id}`
                  : `Detalle de venta${sale ? ` #${sale.id}` : ''}`}
              </Typography>
              {sale ? (
                <Typography color="text.secondary" variant="body2">
                  {dialogMode === 'RETURN'
                    ? 'Selecciona los artículos y las cantidades que deseas devolver.'
                    : formatDateTime(sale.createdAt)}
                </Typography>
              ) : null}
            </Box>
            <IconButton aria-label="Cerrar detalle de venta" onClick={handleClose}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        {loading ? <LinearProgress /> : null}

        <DialogContent dividers sx={{ p: 0 }}>
          <Stack spacing={2.5} sx={{ p: 2.5 }}>
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            {sale ? (
              <>
                {dialogMode === 'DETAIL' ? (
                  <SaleDetailsSummary sale={sale} />
                ) : (
                  <SaleReturnContextLine sale={sale} />
                )}

                {dialogMode === 'DETAIL' ? (
                  <>
                    <SaleItemsTable sale={sale} />

                    <Divider />

                    <SaleReturnsSection
                      autoExpandReturnId={autoExpandReturnId}
                      detail={returnDetails.saleReturn}
                      detailError={returnDetails.error}
                      detailLoading={returnDetails.loading}
                      error={saleReturns.error}
                      loading={saleReturns.loading}
                      onNextPage={() => saleReturns.setPage(saleReturns.page + 1)}
                      onPreviousPage={() => saleReturns.setPage(saleReturns.page - 1)}
                      onViewDetails={(returnId) => void returnDetails.openDetails(returnId)}
                      page={saleReturns.page}
                      returns={saleReturns.returns}
                      size={saleReturns.size}
                      totalElements={saleReturns.totalElements}
                      totalPages={saleReturns.totalPages}
                    />
                  </>
                ) : (
                  <SaleReturnForm
                    apiError={createReturn.error}
                    disabled={createReturn.loading}
                    estimatedCreditBalance={returnForm.estimatedCreditBalance}
                    formError={returnForm.formError}
                    onQuantityChange={returnForm.changeQuantity}
                    onReasonChange={returnForm.changeReason}
                    onToggleItem={returnForm.toggleItem}
                    quantities={returnForm.form.quantities}
                    reason={returnForm.form.reason}
                    items={sale.items}
                    returnSummary={returnForm.returnSummary}
                    sale={sale}
                    selectedIds={returnForm.form.selectedIds}
                  />
                )}
              </>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', px: 2, py: 1.5 }}>
          {dialogMode === 'DETAIL' ? (
            <>
              <Button onClick={handleClose}>Cerrar</Button>
              {canRegisterReturn ? (
                <Button
                  onClick={handleStartReturn}
                  startIcon={<AssignmentReturnRoundedIcon />}
                  variant="contained"
                >
                  Devolver artículos
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button disabled={createReturn.loading} onClick={handleCancelReturn}>
                Volver
              </Button>
              <Button
                disabled={!canConfirmReturn}
                onClick={() => void handleConfirmReturn()}
                startIcon={createReturn.loading ? undefined : <AssignmentReturnRoundedIcon />}
                variant="contained"
              >
                {createReturn.loading ? 'Registrando...' : 'Confirmar devolución'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar autoHideDuration={4500} onClose={() => setMessage(null)} open={Boolean(message)}>
        {message ? <Alert severity={message.severity}>{message.text}</Alert> : undefined}
      </Snackbar>
    </>
  )
}
