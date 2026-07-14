import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded'
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Snackbar,
  Stack,
  Typography,
  type AlertColor,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth'
import { useCashSession } from '../../../cash/session'
import type { Product } from '../../../catalog/products'
import type { Customer } from '../../../customers'
import { ReceivableDetailDrawer } from '../../../receivables/ui/components/ReceivableDetailDrawer'
import { useReceivableDetails } from '../../../receivables/ui/hooks/useReceivableDetails'
import { ROUTE_PATHS } from '../../../../shared/routes/routePaths'
import { ConfirmDialog } from '../../../../shared/ui/components/ConfirmDialog'
import { DataGridShell } from '../../../../shared/ui/components/DataGridShell'
import { EmptyState } from '../../../../shared/ui/components/EmptyState'
import { formatCurrency, formatNumber } from '../../../../shared/utils/formatters'
import type { Sale, SaleType } from '../../domain/entities/Sale'
import {
  BarcodeScannerInput,
  type BarcodeScannerInputHandle,
} from '../components/BarcodeScannerInput'
import { CashCheckoutDialog } from '../components/CashCheckoutDialog'
import { ProductSearchDialog } from '../components/ProductSearchDialog'
import { SaleCartGrid } from '../components/SaleCartGrid'
import { SaleSuccessDialog } from '../components/SaleSuccessDialog'
import { useCreateSale } from '../hooks/useCreateSale'
import { useProductLookup } from '../hooks/useProductLookup'
import { useSaleCart } from '../hooks/useSaleCart'

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  )
}

const isCashSessionError = (message: string): boolean => {
  const normalizedMessage = message.toLowerCase()
  return normalizedMessage.includes('caja') || normalizedMessage.includes('cash session')
}

export const SalesPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { currentSession, refreshCurrentSession } = useCashSession()
  const scannerRef = useRef<BarcodeScannerInputHandle | null>(null)
  const cart = useSaleCart()
  const productLookup = useProductLookup()
  const createSale = useCreateSale()
  const receivableDetails = useReceivableDetails()
  const [searchOpen, setSearchOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [clearCartOpen, setClearCartOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)

  const focusScanner = useCallback(() => {
    if (!searchOpen && !checkoutOpen && !lastSale) {
      scannerRef.current?.focus()
    }
  }, [checkoutOpen, lastSale, searchOpen])

  useEffect(() => {
    focusScanner()
  }, [focusScanner])

  const notify = useCallback((text: string, severity: AlertColor = 'success') => {
    setMessage({ severity, text })
  }, [])

  const addProductToCart = useCallback((product: Product): boolean => {
    const result = cart.addProduct(product)

    if (!result.success) {
      notify(result.message ?? 'No se pudo agregar el producto', 'error')
      scannerRef.current?.focus()
      return false
    }

    notify(`${product.name} agregado`)
    scannerRef.current?.focus()
    return true
  }, [cart, notify])

  const handleScan = useCallback(async (barcode: string): Promise<boolean> => {
    const product = await productLookup.findByBarcode(barcode)

    if (!product) {
      notify(productLookup.error?.message ?? 'Producto no encontrado', 'error')
      return false
    }

    return addProductToCart(product)
  }, [addProductToCart, notify, productLookup])

  const handleRemoveProduct = (productId: number) => {
    cart.removeProduct(productId)
    scannerRef.current?.focus()
  }

  const handleCartResult = (result: { success: boolean; message?: string }) => {
    if (!result.success && result.message) {
      notify(result.message, 'error')
    }
  }

  const openCheckout = useCallback(() => {
    if (!cart.hasItems) {
      notify('Agrega productos antes de cobrar', 'warning')
      scannerRef.current?.focus()
      return
    }

    setCheckoutOpen(true)
  }, [cart.hasItems, notify])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault()
        scannerRef.current?.focus()
        return
      }

      if (event.key === 'Escape') {
        if (checkoutOpen && !createSale.loading) {
          setCheckoutOpen(false)
        } else if (searchOpen) {
          setSearchOpen(false)
          scannerRef.current?.focus()
        } else if (lastSale) {
          setLastSale(null)
          scannerRef.current?.focus()
        }
        return
      }

      if (isEditableTarget(event.target)) {
        return
      }

      if (event.key === 'F4') {
        event.preventDefault()
        setSearchOpen(true)
      }

      if (event.key === 'F8') {
        event.preventDefault()
        openCheckout()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [checkoutOpen, createSale.loading, lastSale, openCheckout, searchOpen])

  const handleConfirmSale = async (values: {
    cashReceived: number | null
    customer: Customer | null
    saleType: SaleType
  }) => {
    const sale = await createSale.createSale({
      saleType: values.saleType,
      customerId: values.customer?.id ?? null,
      cashReceived: values.cashReceived,
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    })

    if (!sale) {
      const error = createSale.getLastError()

      if (error?.status === 409 && isCashSessionError(error.message)) {
        const session = await refreshCurrentSession()

        if (!session) {
          setCheckoutOpen(false)
          navigate(ROUTE_PATHS.cashSessionOpen, {
            replace: true,
            state: { from: location },
          })
          return
        }
      }

      notify(error?.message ?? 'No se pudo registrar la venta', 'error')
      return
    }

    setCheckoutOpen(false)
    cart.clearCart()
    setLastSale(sale)
  }

  const handleClearCart = () => {
    cart.clearCart()
    setClearCartOpen(false)
    scannerRef.current?.focus()
  }

  const summary = useMemo(
    () => [
      { label: 'Productos diferentes', value: cart.items.length.toString() },
      { label: 'Total de unidades', value: formatNumber(cart.totalUnits) },
    ],
    [cart.items.length, cart.totalUnits],
  )

  return (
    <Stack
      spacing={1.5}
      sx={{
        height: { lg: 'calc(100vh - 112px)' },
        minHeight: 0,
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1}
        sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography component="h1" sx={{ fontWeight: 900, lineHeight: 1.1 }} variant="h5">
            Nueva venta
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {`Cajero: ${user?.username ?? currentSession?.openedByUsername ?? '-'}`}
          </Typography>
        </Box>
      </Stack>

      <BarcodeScannerInput
        disabled={checkoutOpen}
        loading={productLookup.loading}
        onOpenSearch={() => setSearchOpen(true)}
        onScan={handleScan}
        ref={scannerRef}
      />

      <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
        <Grid size={{ xs: 12, lg: 9 }} sx={{ minHeight: 0 }}>
          <DataGridShell
            title="Carrito"
            toolbar={
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}
              >
                <Button
                  color="error"
                  disabled={!cart.hasItems}
                  onClick={() => setClearCartOpen(true)}
                  size="small"
                  startIcon={<DeleteSweepRoundedIcon />}
                  variant="outlined"
                >
                  Vaciar carrito
                </Button>
              </Stack>
            }
          >
            {!cart.hasItems ? (
              <EmptyState
                actionIcon={<ShoppingCartRoundedIcon />}
                actionLabel="Buscar producto"
                message="Escanea un codigo de barras o busca un producto para comenzar."
                onAction={() => setSearchOpen(true)}
                title="Carrito vacio"
              />
            ) : (
              <SaleCartGrid
                height="calc(100vh - 330px)"
                items={cart.items}
                onDecrease={(productId) => handleCartResult(cart.decreaseQuantity(productId))}
                onIncrease={(productId) => handleCartResult(cart.increaseQuantity(productId))}
                onRemove={handleRemoveProduct}
                onUpdateQuantity={(productId, quantity) =>
                  handleCartResult(cart.updateQuantity(productId, quantity))
                }
              />
            )}
          </DataGridShell>
        </Grid>

        <Grid size={{ xs: 12, lg: 3 }} sx={{ minHeight: 0 }}>
          <Card
            elevation={0}
            sx={{
              border: 1,
              borderColor: 'divider',
              position: { lg: 'sticky' },
              top: { lg: 88 },
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack spacing={2}>
                <Stack spacing={0.75}>
                  <Typography sx={{ fontWeight: 900 }} variant="h6">
                    Resumen
                  </Typography>
                  {summary.map((item) => (
                    <Stack direction="row" key={item.label} sx={{ justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">{item.label}</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{item.value}</Typography>
                    </Stack>
                  ))}
                </Stack>

                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total
                  </Typography>
                  <Typography sx={{ fontWeight: 900, lineHeight: 1.05 }} variant="h3">
                    {formatCurrency(cart.total)}
                  </Typography>
                </Box>

                <Button
                  disabled={!cart.hasItems}
                  onClick={openCheckout}
                  size="large"
                  startIcon={<PaymentRoundedIcon />}
                  variant="contained"
                >
                  Cobrar
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {createSale.error ? <Alert severity="error">{createSale.error.message}</Alert> : null}

      <ProductSearchDialog
        onAddProduct={addProductToCart}
        onClose={() => {
          setSearchOpen(false)
          scannerRef.current?.focus()
        }}
        open={searchOpen}
      />

      <CashCheckoutDialog
        errorMessage={createSale.error?.message}
        loading={createSale.loading}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={handleConfirmSale}
        open={checkoutOpen}
        serverErrors={createSale.error?.validationErrors}
        total={cart.total}
      />

      <SaleSuccessDialog
        onNewSale={() => {
          setLastSale(null)
          scannerRef.current?.focus()
        }}
        onViewReceivable={(receivableId) => void receivableDetails.openDetails(receivableId)}
        open={Boolean(lastSale)}
        sale={lastSale}
      />

      <ReceivableDetailDrawer
        errorMessage={receivableDetails.error?.message}
        loading={receivableDetails.loading}
        onClose={receivableDetails.closeDetails}
        onPaymentRegistered={async () => {
          await receivableDetails.refreshDetails()
        }}
        open={receivableDetails.open}
        receivable={receivableDetails.receivable}
      />

      <ConfirmDialog
        confirmText="Vaciar"
        message="Se eliminaran todos los productos del carrito."
        onCancel={() => setClearCartOpen(false)}
        onConfirm={handleClearCart}
        open={clearCartOpen}
        title="Vaciar carrito"
      />

      <Snackbar autoHideDuration={2500} onClose={() => setMessage(null)} open={Boolean(message)}>
        <Alert
          onClose={() => setMessage(null)}
          severity={message?.severity ?? 'success'}
          variant="filled"
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Stack>
  )
}
