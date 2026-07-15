import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import type { NormalizedApiError } from '../../../../../shared/api/apiError'
import { formatCurrency, formatDateTime, formatNumber } from '../../../../../shared/utils/formatters'
import { PRODUCT_UNIT_LABELS } from '../../../../catalog/products'
import type { SaleReturnDetails, SaleReturnSummary } from '../../../returns/domain/entities/SaleReturn'

type SaleReturnsSectionProps = {
  autoExpandReturnId?: number | null
  detail: SaleReturnDetails | null
  detailError: NormalizedApiError | null
  detailLoading: boolean
  error: NormalizedApiError | null
  loading: boolean
  onNextPage: () => void
  onPreviousPage: () => void
  onViewDetails: (returnId: number) => void
  page: number
  returns: SaleReturnSummary[]
  size: number
  totalElements: number
  totalPages: number
}

export const SaleReturnsSection = ({
  autoExpandReturnId,
  detail,
  detailError,
  detailLoading,
  error,
  loading,
  onNextPage,
  onPreviousPage,
  onViewDetails,
  page,
  returns,
  size,
  totalElements,
  totalPages,
}: SaleReturnsSectionProps) => {
  const showPagination = totalElements > size
  const [expandedReturnId, setExpandedReturnId] = useState<number | null>(null)
  const handledAutoExpandIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!autoExpandReturnId || handledAutoExpandIdRef.current === autoExpandReturnId) {
      return
    }
    if (!returns.some((saleReturn) => saleReturn.id === autoExpandReturnId)) {
      return
    }

    handledAutoExpandIdRef.current = autoExpandReturnId
    setExpandedReturnId(autoExpandReturnId)
    onViewDetails(autoExpandReturnId)
  }, [autoExpandReturnId, onViewDetails, returns])

  const handleExpand = (returnId: number, expanded: boolean) => {
    setExpandedReturnId(expanded ? returnId : null)
    if (expanded) {
      onViewDetails(returnId)
    }
  }

  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontWeight: 900 }}>Devoluciones</Typography>

      {loading ? <LinearProgress /> : null}
      {error ? <Alert severity="error">{error.message}</Alert> : null}
      {!loading && returns.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          No hay devoluciones registradas.
        </Typography>
      ) : null}

      {returns.length > 0 ? (
        <Stack spacing={1}>
          {returns.map((saleReturn) => (
            <Accordion
              disableGutters
              expanded={expandedReturnId === saleReturn.id}
              key={saleReturn.id}
              onChange={(_event, expanded) => handleExpand(saleReturn.id, expanded)}
              sx={{
                border: 1,
                borderColor: 'divider',
                boxShadow: 'none',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Stack spacing={0.25}>
                  <Typography sx={{ fontWeight: 900 }}>Devolución #{saleReturn.id}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {formatDateTime(saleReturn.createdAt)} · {formatCurrency(saleReturn.totalAmount)} · {saleReturn.processedByUsername}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1.25}>
                  <Typography variant="body2">
                    Motivo: {saleReturn.reason}
                  </Typography>

                  {detailLoading && expandedReturnId === saleReturn.id ? <LinearProgress /> : null}
                  {detailError && expandedReturnId === saleReturn.id ? (
                    <Alert severity="error">{detailError.message}</Alert>
                  ) : null}

                  {detail && detail.id === saleReturn.id ? (
                    <Stack spacing={0.75}>
                      {detail.items.map((item) => (
                        <Stack key={item.saleItemId} spacing={0.25}>
                          <Typography sx={{ fontWeight: 800 }} variant="body2">
                            {item.productName}
                          </Typography>
                          <Typography color="text.secondary" variant="body2">
                            {formatNumber(item.quantity)} {PRODUCT_UNIT_LABELS[item.unit] ?? item.unit} · {formatCurrency(item.subtotal)}
                          </Typography>
                        </Stack>
                      ))}
                      {detail.cashRefundAmount > 0 ? (
                        <Typography variant="body2">
                          Reembolso: {formatCurrency(detail.cashRefundAmount)}
                        </Typography>
                      ) : null}
                    </Stack>
                  ) : null}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      ) : null}

      {showPagination ? (
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button disabled={page === 0} onClick={onPreviousPage} size="small">
            Anterior
          </Button>
          <Button disabled={page + 1 >= totalPages} onClick={onNextPage} size="small">
            Siguiente
          </Button>
        </Stack>
      ) : null}
    </Stack>
  )
}
