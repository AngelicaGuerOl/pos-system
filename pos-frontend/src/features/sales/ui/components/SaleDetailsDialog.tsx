import AssignmentReturnRoundedIcon from '@mui/icons-material/AssignmentReturnRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
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
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  type AlertColor,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '../../../../shared/routes/routePaths'
import { formatCurrency, formatDateTime } from '../../../../shared/utils/formatters'
import { useCashSession } from '../../../cash/session'
import { SALE_TYPE_LABELS, type Sale, type SaleCancellation } from '../../domain/entities/Sale'
import { useCreateSaleReturn } from '../../returns/ui/hooks/useCreateSaleReturn'
import { useSaleReturnForm } from '../../returns/ui/hooks/useSaleReturnForm'
import { useSaleReturnDetails } from '../../returns/ui/hooks/useSaleReturnDetails'
import { useSaleReturns } from '../../returns/ui/hooks/useSaleReturns'
import { useCancelSale } from '../hooks/useCancelSale'
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

type DialogMode = 'DETAIL' | 'RETURN' | 'CANCEL'

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
  const cancelSale = useCancelSale()
  const resetCancelSale = cancelSale.reset
  const createReturn = useCreateSaleReturn()
  const returnForm = useSaleReturnForm(sale)
  const returnDetails = useSaleReturnDetails()
  const resetCreateReturn = createReturn.reset
  const closeReturnDetails = returnDetails.closeDetails
  const resetReturnForm = returnForm.resetReturnForm
  const [dialogMode, setDialogMode] = useState<DialogMode>('DETAIL')
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)
  const [autoExpandReturnId, setAutoExpandReturnId] = useState<number | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [lastCancellation, setLastCancellation] = useState<SaleCancellation | null>(null)

  useEffect(() => {
    if (!open) {
      setDialogMode('DETAIL')
      setAutoExpandReturnId(null)
      resetReturnForm()
      resetCreateReturn()
      resetCancelSale()
      closeReturnDetails()
      setCancelReason('')
      setLastCancellation(null)
    }
  }, [closeReturnDetails, open, resetCancelSale, resetCreateReturn, resetReturnForm])

  const canRegisterReturn = Boolean(
    sale
      && (sale.status === 'COMPLETED' || sale.status === 'PARTIALLY_RETURNED')
      && returnForm.returnableItems.length > 0
      && !loading
      && !createReturn.loading
  )
  const canCancelSale = Boolean(
    sale
      && sale.status === 'COMPLETED'
      && !loading
      && !createReturn.loading
      && !cancelSale.loading,
  )
  const canConfirmCancellation = Boolean(
    sale
      && cancelReason.trim().length > 0
      && cancelReason.trim().length <= 255
      && !cancelSale.loading,
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
    if (cancelSale.loading) {
      return
    }
    resetReturnForm()
    createReturn.reset()
    resetCancelSale()
    setDialogMode('DETAIL')
    setAutoExpandReturnId(null)
    setCancelReason('')
    setLastCancellation(null)
    onClose()
  }

  const handleStartReturn = () => {
    resetReturnForm()
    createReturn.reset()
    resetCancelSale()
    setAutoExpandReturnId(null)
    setCancelReason('')
    setDialogMode('RETURN')
  }

  const handleCancelReturn = () => {
    resetReturnForm()
    createReturn.reset()
    setAutoExpandReturnId(null)
    setDialogMode('DETAIL')
  }

  const handleStartCancellation = () => {
    resetReturnForm()
    createReturn.reset()
    resetCancelSale()
    setDialogMode('CANCEL')
  }

  const handleCancelCancellation = () => {
    resetCancelSale()
    setCancelReason('')
    setDialogMode('DETAIL')
  }

  const handleConfirmCancellation = async () => {
    if (!sale || !canConfirmCancellation) {
      return
    }

    if (sale.saleType === 'CASH') {
      const session = await refreshCurrentSession()
      if (!session) {
        setMessage({
          severity: 'warning',
          text: 'Debes abrir una caja para cancelar una venta de contado.',
        })
        navigate(ROUTE_PATHS.cashSessionOpen, {
          state: { from: location },
        })
        return
      }
    }

    const cancellation = await cancelSale.cancelSale(sale.id, cancelReason.trim())
    if (!cancellation) {
      const error = cancelSale.getLastError()
      if (error?.status === 409 && isCashSessionError(error.message)) {
        await refreshCurrentSession()
        setMessage({
          severity: 'warning',
          text: 'Debes abrir una caja para cancelar una venta de contado.',
        })
        navigate(ROUTE_PATHS.cashSessionOpen, {
          state: { from: location },
        })
      }
      return
    }

    setCancelReason('')
    setLastCancellation(cancellation)
    setDialogMode('DETAIL')
    await saleReturns.refetch()
    await refreshCurrentSession()
    await onReturnRegistered?.()
    setMessage({
      severity: 'success',
      text: 'Venta cancelada correctamente.',
    })
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
        onClose={cancelSale.loading ? undefined : handleClose}
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
                {dialogMode === 'RETURN' && sale ? `Devolver artículos — Venta #${sale.id}` : null}
                {dialogMode === 'CANCEL' && sale ? `Cancelar venta #${sale.id}` : null}
                {dialogMode === 'DETAIL' ? `Detalle de venta${sale ? ` #${sale.id}` : ''}` : null}
              </Typography>
              {sale ? (
                <Typography color="text.secondary" variant="body2">
                  {dialogMode === 'RETURN' ? 'Selecciona los artículos y las cantidades que deseas devolver.' : null}
                  {dialogMode === 'CANCEL' ? 'Confirma la cancelación administrativa de la venta.' : null}
                  {dialogMode === 'DETAIL' ? formatDateTime(sale.createdAt) : null}
                </Typography>
              ) : null}
            </Box>
            <IconButton
              aria-label="Cerrar detalle de venta"
              disabled={cancelSale.loading}
              onClick={handleClose}
            >
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
                  <SaleDetailsSummary
                    actions={(
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        sx={{
                          alignItems: { xs: 'stretch', sm: 'center' },
                          justifyContent: 'flex-end',
                        }}
                      >
                        {canRegisterReturn ? (
                          <Button
                            onClick={handleStartReturn}
                            startIcon={<AssignmentReturnRoundedIcon />}
                            variant="contained"
                          >
                            Devolver artículos
                          </Button>
                        ) : null}
                        {canCancelSale ? (
                          <Button
                            color="error"
                            onClick={handleStartCancellation}
                            startIcon={<CancelRoundedIcon />}
                            variant="outlined"
                          >
                            Cancelar venta
                          </Button>
                        ) : null}
                      </Stack>
                    )}
                    sale={sale}
                  />
                ) : null}

                {dialogMode === 'RETURN' ? (
                  <SaleReturnContextLine sale={sale} />
                ) : null}

                {dialogMode === 'DETAIL' ? (
                  <>
                    {sale.status === 'CANCELLED' && lastCancellation ? (
                      <Alert severity="info">
                        <Stack spacing={0.5}>
                          <Typography sx={{ fontWeight: 800 }}>
                            Venta cancelada
                          </Typography>
                          <Typography variant="body2">
                            Motivo: {lastCancellation.reason}
                          </Typography>
                          <Typography variant="body2">
                            Canceló: {lastCancellation.cancelledByUsername}
                          </Typography>
                          <Typography variant="body2">
                            Fecha: {formatDateTime(lastCancellation.createdAt)}
                          </Typography>
                          {lastCancellation.refundAmount > 0 ? (
                            <Typography variant="body2">
                              Reembolso: {formatCurrency(lastCancellation.refundAmount)}
                            </Typography>
                          ) : null}
                        </Stack>
                      </Alert>
                    ) : null}

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
                ) : null}

                {dialogMode === 'RETURN' ? (
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
                ) : null}

                {dialogMode === 'CANCEL' ? (
                  <Stack spacing={2.5}>
                    <Box
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'grid',
                          gap: 2,
                          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
                        }}
                      >
                        <Stack spacing={0.25}>
                          <Typography color="text.secondary" variant="caption">
                            Cliente
                          </Typography>
                          <Typography sx={{ fontWeight: 800 }}>
                            {sale.customerFullName || 'Público general'}
                          </Typography>
                        </Stack>
                        <Stack spacing={0.25}>
                          <Typography color="text.secondary" variant="caption">
                            Tipo de venta
                          </Typography>
                          <Typography sx={{ fontWeight: 800 }}>
                            {SALE_TYPE_LABELS[sale.saleType]}
                          </Typography>
                        </Stack>
                        <Stack spacing={0.25}>
                          <Typography color="text.secondary" variant="caption">
                            Total
                          </Typography>
                          <Typography sx={{ fontWeight: 900 }}>
                            {formatCurrency(sale.total)}
                          </Typography>
                        </Stack>
                      </Box>
                    </Box>

                    <Alert severity="warning">
                      {sale.saleType === 'CASH'
                        ? `Esta acción restaurará todo el inventario y reembolsará ${formatCurrency(sale.total)} en efectivo. Debes tener una caja abierta.`
                        : 'Esta acción restaurará todo el inventario y cancelará la cuenta por cobrar. No se realizará ningún movimiento de efectivo.'}
                    </Alert>

                    <TextField
                      disabled={cancelSale.loading}
                      error={Boolean(cancelSale.error) || cancelReason.trim().length > 255}
                      fullWidth
                      helperText={
                        cancelSale.error?.message
                        ?? (cancelReason.trim().length > 255
                          ? 'El motivo debe tener máximo 255 caracteres.'
                          : `${cancelReason.trim().length}/255`)
                      }
                      label="Motivo de cancelación"
                      maxRows={3}
                      minRows={2}
                      multiline
                      onChange={(event) => {
                        if (cancelSale.error) {
                          resetCancelSale()
                        }
                        setCancelReason(event.target.value)
                      }}
                      required
                      value={cancelReason}
                    />
                  </Stack>
                ) : null}
              </>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', px: 2, py: 1.5 }}>
          {dialogMode === 'DETAIL' ? (
            <Button onClick={handleClose}>Cerrar</Button>
          ) : null}
          {dialogMode === 'RETURN' ? (
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
          ) : null}
          {dialogMode === 'CANCEL' ? (
            <>
              <Button disabled={cancelSale.loading} onClick={handleCancelCancellation}>
                Volver
              </Button>
              <Button
                color="error"
                disabled={!canConfirmCancellation}
                onClick={() => void handleConfirmCancellation()}
                startIcon={cancelSale.loading ? undefined : <CancelRoundedIcon />}
                variant="contained"
              >
                {cancelSale.loading ? 'Cancelando...' : 'Cancelar venta'}
              </Button>
            </>
          ) : null}
        </DialogActions>
      </Dialog>

      <Snackbar autoHideDuration={4500} onClose={() => setMessage(null)} open={Boolean(message)}>
        {message ? <Alert severity={message.severity}>{message.text}</Alert> : undefined}
      </Snackbar>
    </>
  )
}
