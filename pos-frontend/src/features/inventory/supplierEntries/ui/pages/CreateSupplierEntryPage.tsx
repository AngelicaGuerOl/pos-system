import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded'
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Checkbox,
  type AlertColor,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { normalizeApiError } from '../../../../../shared/api/apiError'
import { DataGridShell } from '../../../../../shared/ui/components/DataGridShell'
import { PageHeader } from '../../../../../shared/ui/components/PageHeader'
import { ROUTE_PATHS } from '../../../../../shared/routes/routePaths'
import { formatCurrency, formatNumber } from '../../../../../shared/utils/formatters'
import { useCategories } from '../../../../catalog/categories/ui/hooks/useCategories'
import { productDependencies } from '../../../../catalog/products'
import {
  PRODUCT_UNIT_LABELS,
  PRODUCT_UNITS,
  type BarcodeLookup,
  type Product,
  type ProductUnit,
} from '../../../../catalog/products/domain/entities/Product'
import { useSuppliers } from '../../../../catalog/suppliers/ui/hooks/useSuppliers'
import { useSupplierProducts } from '../../../../catalog/suppliers/ui/hooks/useSupplierProducts'
import { useCreateSupplierEntry } from '../hooks/useCreateSupplierEntry'
import type { SupplierEntryType } from '../../domain/entities/SupplierEntry'

type EntryLine = {
  key: string
  productId: number | null
  isNew: boolean
  productName: string
  barcode: string
  categoryId: number
  categoryName: string
  unit: ProductUnit | ''
  quantity: string
  unitCost: string
  salePrice: string
  currentStock: number
  brand?: string | null
  presentation?: string | null
}

const BARCODE_MAX_LENGTH = 50
const isDecimalText = (value: string): boolean => /^\d*(?:\.\d{0,2})?$/.test(value)
const toNumber = (value: string): number => Number(value || '0')
const normalizeBarcode = (value: string): string => value.trim()

export const CreateSupplierEntryPage = () => {
  const navigate = useNavigate()
  const scannerRef = useRef<HTMLInputElement | null>(null)
  const quantityRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const pendingBarcodeRef = useRef<string | null>(null)
  const productSearchRequestRef = useRef(0)
  const [entryType, setEntryType] = useState<SupplierEntryType>('SUPPLIER_PURCHASE')
  const [supplierId, setSupplierId] = useState(0)
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([])
  const [productSearchOpen, setProductSearchOpen] = useState(false)
  const [lines, setLines] = useState<Record<string, EntryLine>>({})
  const [showIncludedOnly, setShowIncludedOnly] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [productSearchLoading, setProductSearchLoading] = useState(false)
  const [productSearchError, setProductSearchError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; severity: AlertColor } | null>(null)
  const [pendingEntryType, setPendingEntryType] = useState<SupplierEntryType | null>(null)
  const [pendingRemoveLine, setPendingRemoveLine] = useState<EntryLine | null>(null)
  const isInitialInventory = entryType === 'INITIAL_INVENTORY'
  const suppliersState = useSuppliers({ active: true, size: 50 })
  const categoriesState = useCategories()
  const productsState = useSupplierProducts(!isInitialInventory && supplierId ? supplierId : undefined, { size: 20 })
  const createEntry = useCreateSupplierEntry()
  const quantityLabel = isInitialInventory ? 'Existencia inicial' : 'Cantidad recibida'
  const actionLabel = isInitialInventory ? 'Registrar inventario inicial' : 'Registrar mercancia'
  const pageSubtitle = isInitialInventory
    ? 'Registra las existencias fisicas con las que iniciara el sistema.'
    : 'Registra los productos recibidos de un proveedor y actualiza sus existencias.'
  const selectableCategories = useMemo(
    () => categoriesState.categories.filter((category) => !['historico', 'histórico'].includes(category.name.trim().toLowerCase())),
    [categoriesState.categories],
  )

  const includedLines = useMemo(
    () => Object.values(lines).filter((line) => toNumber(line.quantity) > 0 || line.isNew),
    [lines],
  )
  const totals = useMemo(() => {
    return includedLines.reduce(
      (summary, line) => ({
        quantity: summary.quantity + toNumber(line.quantity),
        cost: summary.cost + toNumber(line.quantity) * toNumber(line.unitCost),
        sale: summary.sale + toNumber(line.quantity) * toNumber(line.salePrice),
      }),
      { cost: 0, quantity: 0, sale: 0 },
    )
  }, [includedLines])

  const visibleProducts = useMemo(
    () => {
      const sourceProducts = isInitialInventory ? [] : productsState.products
      return sourceProducts.filter((product) => {
        const line = lines[`existing-${product.id}`]
        const included = Boolean(line) || toNumber(line?.quantity ?? '') > 0
        return !showIncludedOnly || included
      })
    },
    [isInitialInventory, lines, productsState.products, showIncludedOnly],
  )
  const visibleProductKeys = useMemo(
    () => new Set(visibleProducts.map((product) => `existing-${product.id}`)),
    [visibleProducts],
  )
  const additionalExistingLines = useMemo(
    () => Object.values(lines).filter((line) => !line.isNew && !visibleProductKeys.has(line.key)),
    [lines, visibleProductKeys],
  )
  const newLines = useMemo(
    () => Object.values(lines).filter((line) => line.isNew),
    [lines],
  )
  const visibleTableRowCount = visibleProducts.length + additionalExistingLines.length + newLines.length
  const paginationCount = showIncludedOnly ? visibleTableRowCount : Math.max(productsState.totalElements, visibleTableRowCount)
  const paginationPage = showIncludedOnly ? 0 : productsState.page

  useEffect(() => {
    const search = productSearch.trim()
    const requestId = productSearchRequestRef.current + 1
    productSearchRequestRef.current = requestId

    if (search.length < 2) {
      setProductSearchResults([])
      setProductSearchLoading(false)
      setProductSearchError(null)
      return
    }

    setProductSearchError(null)
    const timeoutId = window.setTimeout(() => {
      setProductSearchLoading(true)
      void productDependencies.getProductsUseCase.execute({ page: 0, search, size: 10, sort: 'name,asc' })
        .then((page) => {
          if (productSearchRequestRef.current !== requestId) {
            return
          }
          const normalizedSearch = search.toLowerCase()
          setProductSearchResults(page.content.filter((product) => product.name.toLowerCase().includes(normalizedSearch)).slice(0, 10))
        })
        .catch((unknownError) => {
          if (productSearchRequestRef.current !== requestId) {
            return
          }
          setProductSearchResults([])
          setProductSearchError(normalizeApiError(unknownError).message)
        })
        .finally(() => {
          if (productSearchRequestRef.current === requestId) {
            setProductSearchLoading(false)
          }
        })
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [productSearch])

  const updateLine = (line: EntryLine) => setLines((current) => ({ ...current, [line.key]: line }))
  const removeLine = (key: string) => setLines((current) => {
    const next = { ...current }
    delete next[key]
    return next
  })

  const lineHasCapturedData = (line: EntryLine) => (
    line.isNew
    || Boolean(lines[line.key])
    || line.quantity !== ''
    || line.unitCost !== ''
    || line.salePrice !== ''
  )

  const requestRemoveLine = (line: EntryLine) => {
    if (lineHasCapturedData(line)) {
      setPendingRemoveLine(line)
      return
    }
    removeLine(line.key)
  }

  const cancelRemoveLine = () => {
    setPendingRemoveLine(null)
  }

  const confirmRemoveLine = () => {
    if (pendingRemoveLine) {
      removeLine(pendingRemoveLine.key)
    }
    setPendingRemoveLine(null)
    focusScanner()
  }

  const focusScanner = () => {
    window.setTimeout(() => scannerRef.current?.focus(), 0)
  }

  const focusQuantity = (key: string) => {
    window.setTimeout(() => quantityRefs.current[key]?.focus(), 0)
  }

  const notify = (text: string, severity: AlertColor = 'info') => setMessage({ severity, text })

  const incrementLine = (line: EntryLine) => {
    const nextQuantity = String(toNumber(line.quantity) + 1)
    updateLine({ ...line, quantity: nextQuantity })
    notify('El producto ya estaba en la recepcion. Se incremento la cantidad.')
    focusQuantity(line.key)
  }

  const handleSupplierChange = (nextSupplierId: number) => {
    if (includedLines.length > 0 && !window.confirm('Cambiar proveedor limpiara los productos capturados.')) {
      return
    }
    setSupplierId(nextSupplierId)
    setLines({})
    setBarcodeInput('')
    setProductSearch('')
    setProductSearchResults([])
    focusScanner()
  }

  const applyEntryTypeChange = (nextEntryType: SupplierEntryType) => {
    setEntryType(nextEntryType)
    setLines({})
    setBarcodeInput('')
    setProductSearch('')
    setProductSearchResults([])
    setShowIncludedOnly(nextEntryType === 'INITIAL_INVENTORY')
    focusScanner()
  }

  const handleEntryTypeChange = (nextEntryType: SupplierEntryType) => {
    if (nextEntryType === entryType) {
      return
    }
    if (includedLines.length === 0) {
      applyEntryTypeChange(nextEntryType)
      return
    }
    setPendingEntryType(nextEntryType)
  }

  const cancelEntryTypeChange = () => {
    setPendingEntryType(null)
  }

  const confirmEntryTypeChange = () => {
    if (pendingEntryType) {
      applyEntryTypeChange(pendingEntryType)
    }
    setPendingEntryType(null)
  }

  const buildExistingLine = (product: Product, quantity = ''): EntryLine => ({
    barcode: product.barcode,
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    currentStock: product.currentStock,
    isNew: false,
    key: `existing-${product.id}`,
    productId: product.id,
    productName: product.name,
    quantity,
    salePrice: String(product.salePrice),
    unit: product.unit,
    unitCost: product.costPriceKnown ? String(product.costPrice) : '',
  })

  const addExistingProduct = (product: Product, quantity = '') => {
    const key = `existing-${product.id}`
    const current = lines[key]
    if (current) {
      incrementLine(current)
      return
    }
    updateLine(buildExistingLine(product, quantity))
    focusQuantity(key)
  }

  const handleSelectLocalProduct = (product: Product) => {
    if (lines[`existing-${product.id}`]) {
      notify('El producto ya esta incluido en esta entrada.')
    setProductSearch('')
    setProductSearchResults([])
    setProductSearchOpen(false)
    return
  }
  addExistingProduct(product, '1')
  setProductSearch('')
  setProductSearchResults([])
  setProductSearchOpen(false)
}

  const addManualNewLine = (barcode: string, lookup?: BarcodeLookup) => {
    const key = `new-${barcode.toLowerCase()}`
    const current = lines[key]
    if (current) {
      incrementLine(current)
      return
    }
    updateLine({
      barcode,
      brand: lookup?.brand ?? null,
      categoryId: 0,
      categoryName: '',
      currentStock: 0,
      isNew: true,
      key,
      presentation: lookup?.presentation ?? null,
      productId: null,
      productName: lookup?.suggestedName ?? '',
      quantity: '',
      salePrice: '',
      unit: '',
      unitCost: '',
    })
    focusQuantity(key)
  }

  const handleLookupResponse = (lookup: BarcodeLookup) => {
    if (lookup.status === 'LOCAL_PRODUCT_EXISTS') {
      if (!lookup.existingProductActive) {
        notify('El codigo ya existe en un producto inactivo. Reactivalo desde productos antes de registrar mercancia.', 'error')
        return
      }
      if (lookup.existingProduct) {
        addExistingProduct(lookup.existingProduct, '1')
      }
      return
    }

    addManualNewLine(lookup.barcode, lookup)
    if (lookup.status === 'NOT_FOUND') {
      notify('No encontramos informacion para este codigo. Escribe el nombre para continuar.')
      return
    }
    notify('Producto nuevo agregado temporalmente.')
  }

  const handleBarcodeKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return
    }
    event.preventDefault()
    const barcode = normalizeBarcode(barcodeInput)
    if (!isInitialInventory && !supplierId) {
      notify('Selecciona proveedor antes de escanear.', 'error')
      return
    }
    if (!barcode || barcode.length > BARCODE_MAX_LENGTH || pendingBarcodeRef.current === barcode) {
      return
    }

    pendingBarcodeRef.current = barcode
    setLookupLoading(true)
    try {
      const lookup = await productDependencies.lookupBarcodeUseCase.execute(barcode)
      handleLookupResponse(lookup)
      setBarcodeInput('')
    } catch (unknownError) {
      const error = normalizeApiError(unknownError)
      addManualNewLine(barcode)
      notify(
        error.status === 503
          ? 'No fue posible consultar el catalogo externo. Puedes registrar el producto manualmente.'
          : error.message,
        error.status === 503 ? 'warning' : 'error',
      )
      setBarcodeInput('')
    } finally {
      pendingBarcodeRef.current = null
      setLookupLoading(false)
      focusScanner()
    }
  }

  const handleIncludedOnlyChange = (checked: boolean) => {
    setShowIncludedOnly(checked)
    productsState.setPage(0)
  }

  const validateBeforeSubmit = (): boolean => {
    if (!isInitialInventory && !supplierId) {
      notify('Selecciona proveedor para compra a proveedor.', 'error')
      return false
    }
    if (includedLines.length === 0) {
      notify('Agrega al menos un producto.', 'error')
      return false
    }
    for (const line of includedLines) {
      if (line.isNew && !line.productName.trim()) {
        notify('Escribe el nombre de todos los productos nuevos.', 'error')
        return false
      }
      if (line.isNew && !line.categoryId) {
        notify('Selecciona categoria para todos los productos nuevos.', 'error')
        return false
      }
      if (line.isNew && !line.unit) {
        notify('Selecciona unidad para todos los productos nuevos.', 'error')
        return false
      }
      if (toNumber(line.quantity) <= 0 || toNumber(line.unitCost) < 0 || toNumber(line.salePrice) <= 0) {
        notify(`Revisa ${quantityLabel.toLowerCase()}, costo y precio de venta.`, 'error')
        return false
      }
      if (toNumber(line.salePrice) < toNumber(line.unitCost)) {
        notify('El precio de venta no debe ser menor que el costo unitario.', 'error')
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (createEntry.loading || !validateBeforeSubmit()) {
      return
    }
    const result = await createEntry.createEntry({
      supplierId: isInitialInventory ? supplierId || null : supplierId,
      entryType,
      entryDate,
      notes,
      items: includedLines.map((line) => ({
        productId: line.productId,
        newProduct: line.isNew ? {
          barcode: line.barcode,
          categoryId: line.categoryId,
          minimumStock: 0,
          name: line.productName.trim(),
          unit: line.unit as ProductUnit,
        } : null,
        quantity: toNumber(line.quantity),
        unitCost: toNumber(line.unitCost),
        salePrice: toNumber(line.salePrice),
      })),
    })
    if (result) {
      notify(`${isInitialInventory ? 'Inventario inicial registrado' : 'Mercancia registrada'}. Total costo ${formatCurrency(result.totalCost)}.`, 'success')
      setLines({})
      setBarcodeInput('')
      setProductSearchResults([])
      setProductSearchOpen(false)
      focusScanner()
      if (result.id) {
        navigate(ROUTE_PATHS.supplierEntryDetails.replace(':entryId', String(result.id)))
      }
    }
  }

  const renderEditableDecimal = (line: EntryLine, field: 'quantity' | 'unitCost' | 'salePrice') => (
    <TextField
      inputRef={field === 'quantity' ? (element) => { quantityRefs.current[line.key] = element } : undefined}
      slotProps={{ htmlInput: { inputMode: 'decimal' } }}
      onChange={(event) => {
        if (isDecimalText(event.target.value)) {
          updateLine({ ...line, [field]: event.target.value })
        }
      }}
      size="small"
      value={line[field]}
    />
  )

  const renderLineRow = (line: EntryLine) => {
    const lineInOperation = line.isNew || Boolean(lines[line.key])
    return (
    <TableRow key={line.key} sx={{ bgcolor: line.isNew ? 'warning.50' : toNumber(line.quantity) > 0 ? 'success.50' : undefined }}>
      <TableCell sx={{ minWidth: 220 }}>
        <Stack spacing={0.5}>
          {line.isNew ? (
            <TextField
              label="Nombre"
              onChange={(event) => updateLine({ ...line, productName: event.target.value })}
              required
              size="small"
              value={line.productName}
            />
          ) : (
            <Typography>{line.productName}</Typography>
          )}
          {line.isNew ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Chip color="warning" label="Nuevo" size="small" />
            </Stack>
          ) : null}
        </Stack>
      </TableCell>
      <TableCell sx={{ minWidth: 140 }}>{line.barcode}</TableCell>
      <TableCell sx={{ minWidth: 180 }}>
        {line.isNew ? (
          <FormControl fullWidth required size="small">
            <InputLabel>Categoria</InputLabel>
            <Select
              label="Categoria"
              onChange={(event) => updateLine({ ...line, categoryId: Number(event.target.value) })}
              value={line.categoryId}
            >
              <MenuItem value={0}>Selecciona</MenuItem>
              {selectableCategories.map((category) => (
                <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : line.categoryName}
      </TableCell>
      <TableCell sx={{ minWidth: 150 }}>
        {line.isNew ? (
          <FormControl fullWidth required size="small">
            <InputLabel>Unidad</InputLabel>
            <Select
              label="Unidad"
              onChange={(event) => updateLine({ ...line, unit: event.target.value as ProductUnit })}
              value={line.unit}
            >
              <MenuItem value="">Selecciona</MenuItem>
              {PRODUCT_UNITS.map((unit) => (
                <MenuItem key={unit} value={unit}>{PRODUCT_UNIT_LABELS[unit]}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : PRODUCT_UNIT_LABELS[line.unit as ProductUnit]}
      </TableCell>
      <TableCell align="right">{formatNumber(line.currentStock)}</TableCell>
      <TableCell>{renderEditableDecimal(line, 'quantity')}</TableCell>
      <TableCell>{renderEditableDecimal(line, 'unitCost')}</TableCell>
      <TableCell>{renderEditableDecimal(line, 'salePrice')}</TableCell>
      <TableCell align="right">
        {lineInOperation ? (
          <Tooltip title="Quitar de esta entrada">
            <IconButton aria-label="Quitar de esta entrada" onClick={() => requestRemoveLine(line)} size="small">
              <RemoveCircleOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </TableCell>
    </TableRow>
    )
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        subtitle={pageSubtitle}
        title="Registrar mercancia"
      />
      <DataGridShell loading={productsState.loading || suppliersState.loading || categoriesState.loading || productSearchLoading}>
        <Stack spacing={2}>
          {createEntry.error ? <Alert severity="error">{createEntry.error.message}</Alert> : null}
          {productsState.error ? <Alert severity="error">{productsState.error.message}</Alert> : null}
          {categoriesState.error ? <Alert severity="error">{categoriesState.error.message}</Alert> : null}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl required size="small" sx={{ minWidth: 230 }}>
              <InputLabel>Tipo de entrada</InputLabel>
              <Select
                label="Tipo de entrada"
                onChange={(event) => handleEntryTypeChange(event.target.value as SupplierEntryType)}
                value={entryType}
              >
                <MenuItem value="SUPPLIER_PURCHASE">Compra a proveedor</MenuItem>
                <MenuItem value="INITIAL_INVENTORY">Inventario inicial</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Fecha"
              onChange={(event) => setEntryDate(event.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ minWidth: 180 }}
              type="date"
              value={entryDate}
            />
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel>{isInitialInventory ? 'Proveedor predeterminado (opcional)' : 'Proveedor'}</InputLabel>
              <Select
                label={isInitialInventory ? 'Proveedor predeterminado (opcional)' : 'Proveedor'}
                onChange={(event) => handleSupplierChange(Number(event.target.value))}
                value={supplierId}
              >
                <MenuItem value={0}>{isInitialInventory ? 'Sin proveedor' : 'Selecciona proveedor'}</MenuItem>
                {suppliersState.suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>
                ))}
              </Select>
              {isInitialInventory ? (
                <FormHelperText>Se asignará automáticamente a los productos nuevos de esta operación.</FormHelperText>
              ) : null}
            </FormControl>
            <TextField fullWidth label="Notas" onChange={(event) => setNotes(event.target.value)} size="small" value={notes} />
          </Stack>
          {supplierId || isInitialInventory ? (
            <>
              <TextField
                disabled={lookupLoading || createEntry.loading}
                error={barcodeInput.trim().length > BARCODE_MAX_LENGTH}
                fullWidth
                helperText={barcodeInput.trim().length > BARCODE_MAX_LENGTH ? `El codigo no debe superar ${BARCODE_MAX_LENGTH} caracteres` : undefined}
                inputRef={scannerRef}
                label="Escanear código de barras"
                onChange={(event) => setBarcodeInput(event.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Escanea o escribe el código y presiona Enter"
                size="small"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <QrCodeScannerRoundedIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: lookupLoading ? (
                      <InputAdornment position="end">
                        <CircularProgress size={18} />
                      </InputAdornment>
                    ) : null,
                  },
                }}
                value={barcodeInput}
              />
              <Autocomplete
                clearOnBlur={false}
                filterOptions={(options) => options}
                getOptionDisabled={(option) => Boolean(lines[`existing-${option.id}`])}
                getOptionLabel={(option) => option.name}
                inputValue={productSearch}
                loading={productSearchLoading}
                loadingText="Buscando productos..."
                noOptionsText={productSearchError ?? (productSearch.trim().length < 2 ? 'Escribe al menos 2 caracteres' : 'Sin resultados')}
                onChange={(_event, product) => {
                  if (product) {
                    handleSelectLocalProduct(product)
                  }
                }}
                onInputChange={(_event, value, reason) => {
                  if (reason === 'input') {
                    setProductSearch(value)
                    setProductSearchOpen(value.trim().length >= 2)
                  }
                  if (reason === 'clear') {
                    setProductSearch('')
                    setProductSearchResults([])
                    setProductSearchError(null)
                    setProductSearchOpen(false)
                  }
                }}
                onClose={() => setProductSearchOpen(false)}
                onOpen={() => setProductSearchOpen(productSearch.trim().length >= 2)}
                open={productSearchOpen && productSearch.trim().length >= 2}
                options={productSearchResults}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={Boolean(productSearchError)}
                    helperText={productSearchError ?? undefined}
                    label="Buscar producto por nombre"
                    placeholder="Escribe el nombre del producto"
                    size="small"
                    slotProps={{
                      htmlInput: params.slotProps.htmlInput,
                      inputLabel: params.slotProps.inputLabel,
                      input: {
                        ...params.slotProps.input,
                        startAdornment: (
                          <>
                            <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>
                            {params.slotProps.input.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {productSearchLoading ? <CircularProgress color="inherit" size={18} /> : null}
                            {params.slotProps.input.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const included = Boolean(lines[`existing-${option.id}`])
                  return (
                    <Box component="li" {...props} key={option.id}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700 }}>{option.name}</Typography>
                        <Typography color="text.secondary" variant="caption">
                          {option.barcode} · {option.categoryName} · {PRODUCT_UNIT_LABELS[option.unit]}{included ? ' · Ya incluido' : ''}
                        </Typography>
                      </Box>
                    </Box>
                  )
                }}
                value={null}
              />
              <FormControlLabel
                control={<Checkbox checked={showIncludedOnly} onChange={(event) => handleIncludedOnlyChange(event.target.checked)} />}
                label="Mostrar solo productos incluidos"
              />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Codigo</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Unidad</TableCell>
                    <TableCell align="right">Stock actual</TableCell>
                    <TableCell>{quantityLabel}</TableCell>
                    <TableCell>Costo de compra</TableCell>
                    <TableCell>Precio de venta</TableCell>
                    <TableCell align="right">Accion</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleProducts.map((product) => {
                    const key = `existing-${product.id}`
                    const line = lines[key] ?? buildExistingLine(product)
                    return renderLineRow(line)
                  })}
                  {additionalExistingLines.map(renderLineRow)}
                  {newLines.map(renderLineRow)}
                </TableBody>
              </Table>
              {!isInitialInventory ? (
                <TablePagination
                  component="div"
                  count={paginationCount}
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                  labelRowsPerPage="Filas por pagina"
                  onPageChange={(_event, nextPage) => productsState.setPage(nextPage)}
                  onRowsPerPageChange={(event) => productsState.setSize(Number(event.target.value))}
                  page={paginationPage}
                  rowsPerPage={productsState.size}
                  rowsPerPageOptions={[10, 20, 50]}
                />
              ) : null}
            </>
          ) : (
            <Alert severity="info">Selecciona un proveedor activo para capturar productos.</Alert>
          )}
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Productos incluidos: {includedLines.length}</Typography>
            <Typography color="text.secondary">
              {isInitialInventory ? 'Existencia inicial total' : 'Cantidad total'} {formatNumber(totals.quantity)} · Total costo {formatCurrency(totals.cost)} · Valor venta {formatCurrency(totals.sale)}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              bottom: 0,
              boxShadow: 3,
              mx: -2,
              p: 2,
              position: 'sticky',
              zIndex: 2,
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Typography><strong>Productos:</strong> {includedLines.length}</Typography>
                <Typography><strong>{isInitialInventory ? 'Existencia inicial' : 'Cantidad'}:</strong> {formatNumber(totals.quantity)}</Typography>
                <Typography><strong>Total costo:</strong> {formatCurrency(totals.cost)}</Typography>
                <Typography><strong>Valor venta:</strong> {formatCurrency(totals.sale)}</Typography>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
                <Button onClick={() => navigate(ROUTE_PATHS.products)}>Ir a productos</Button>
                <Button disabled={createEntry.loading} onClick={handleSubmit} startIcon={<SaveRoundedIcon />} variant="contained">
                  {actionLabel}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </DataGridShell>
      <Snackbar autoHideDuration={3000} onClose={() => setMessage(null)} open={Boolean(message)}>
        <Alert onClose={() => setMessage(null)} severity={message?.severity ?? 'success'} variant="filled">{message?.text}</Alert>
      </Snackbar>
      <Dialog
        aria-labelledby="entry-type-change-dialog-title"
        onClose={cancelEntryTypeChange}
        open={Boolean(pendingEntryType)}
      >
        <DialogTitle id="entry-type-change-dialog-title">Cambiar tipo de entrada</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Al cambiar el tipo de entrada se eliminarán los productos y valores capturados.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelEntryTypeChange}>Cancelar</Button>
          <Button onClick={confirmEntryTypeChange} variant="contained">Cambiar y limpiar</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        aria-labelledby="remove-line-dialog-title"
        onClose={cancelRemoveLine}
        open={Boolean(pendingRemoveLine)}
      >
        <DialogTitle id="remove-line-dialog-title">Quitar de esta entrada</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se limpiarán los valores capturados para este producto en la operación actual.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelRemoveLine}>Cancelar</Button>
          <Button onClick={confirmRemoveLine} variant="contained">Quitar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
