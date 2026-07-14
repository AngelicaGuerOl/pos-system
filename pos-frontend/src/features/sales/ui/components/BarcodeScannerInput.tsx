import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material'
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

const BARCODE_MAX_LENGTH = 50
const SCANNER_IDLE_DELAY_MS = 250

export type BarcodeScannerInputHandle = {
  focus: () => void
}

type BarcodeScannerInputProps = {
  loading: boolean
  disabled?: boolean
  onOpenSearch: () => void
  onScan: (barcode: string) => Promise<boolean>
}

export const BarcodeScannerInput = forwardRef<BarcodeScannerInputHandle, BarcodeScannerInputProps>(
  ({ disabled = false, loading, onOpenSearch, onScan }, ref) => {
    const [value, setValue] = useState('')
    const inputRef = useRef<HTMLInputElement | null>(null)
    const timeoutRef = useRef<number | null>(null)
    const processingCodeRef = useRef<string | null>(null)

    const focus = useCallback(() => {
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }, [])

    useImperativeHandle(ref, () => ({ focus }), [focus])

    const cancelPendingLookup = useCallback(() => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }, [])

    const processBarcode = useCallback(async (rawBarcode: string) => {
      const barcode = rawBarcode.trim()

      if (!barcode || barcode.length > BARCODE_MAX_LENGTH) {
        return
      }

      if (processingCodeRef.current === barcode) {
        return
      }

      processingCodeRef.current = barcode

      try {
        await onScan(barcode)
        setValue('')
      } finally {
        processingCodeRef.current = null
        focus()
      }
    }, [focus, onScan])

    const scheduleLookup = useCallback((nextValue: string) => {
      cancelPendingLookup()
      const barcode = nextValue.trim()

      if (!barcode || barcode.length > BARCODE_MAX_LENGTH) {
        return
      }

      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null
        void processBarcode(barcode)
      }, SCANNER_IDLE_DELAY_MS)
    }, [cancelPendingLookup, processBarcode])

    const handleChange = (nextValue: string) => {
      setValue(nextValue)
      scheduleLookup(nextValue)
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') {
        return
      }

      event.preventDefault()
      cancelPendingLookup()
      void processBarcode(value)
    }

    return (
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: 'stretch' }}>
        <TextField
          disabled={disabled}
          error={value.trim().length > BARCODE_MAX_LENGTH}
          fullWidth
          helperText={
            value.trim().length > BARCODE_MAX_LENGTH
              ? `El codigo no debe superar ${BARCODE_MAX_LENGTH} caracteres`
              : undefined
          }
          inputRef={inputRef}
          label="Código de barras"
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escanea o escribe el código del producto"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <QrCodeScannerRoundedIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: loading ? (
                <InputAdornment position="end">
                  <CircularProgress size={18} />
                </InputAdornment>
              ) : null,
            },
          }}
          value={value}
          size="small"
        />

        <Button
          disabled={disabled}
          onClick={onOpenSearch}
          size="small"
          startIcon={<SearchRoundedIcon />}
          sx={{ minHeight: 40, minWidth: { xs: '100%', md: 170 } }}
          variant="outlined"
        >
          Buscar producto
        </Button>
      </Stack>
    )
  },
)

BarcodeScannerInput.displayName = 'BarcodeScannerInput'
