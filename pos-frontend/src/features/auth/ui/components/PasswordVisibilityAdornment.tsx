import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import { IconButton, InputAdornment } from '@mui/material'

type PasswordVisibilityAdornmentProps = {
  visible: boolean
  disabled?: boolean
  onToggle: () => void
}

export const PasswordVisibilityAdornment = ({
  visible,
  disabled = false,
  onToggle,
}: PasswordVisibilityAdornmentProps) => {
  return (
    <InputAdornment position="end">
      <IconButton
        aria-label={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
        disabled={disabled}
        edge="end"
        onClick={onToggle}
      >
        {visible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
      </IconButton>
    </InputAdornment>
  )
}

