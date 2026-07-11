import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  return (
    <Dialog fullWidth maxWidth="xs" onClose={loading ? undefined : onCancel} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button disabled={loading} onClick={onCancel}>
          {cancelText}
        </Button>
        <Button
          color="error"
          disabled={loading}
          onClick={onConfirm}
          startIcon={loading ? <CircularProgress color="inherit" size={16} /> : null}
          variant="contained"
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

