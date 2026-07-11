import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import { Box, Button, Paper, Typography } from '@mui/material'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  message: string
  actionLabel?: string
  actionIcon?: ReactNode
  onAction?: () => void
}

export const EmptyState = ({ title, message, actionLabel, actionIcon, onAction }: EmptyStateProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        alignItems: 'center',
        border: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: 4,
        textAlign: 'center',
      }}
    >
      <Inventory2OutlinedIcon color="disabled" fontSize="large" />
      <Box>
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
        <Typography color="text.secondary" variant="body2">
          {message}
        </Typography>
      </Box>
      {actionLabel && onAction ? (
        <Button onClick={onAction} startIcon={actionIcon} variant="outlined">
          {actionLabel}
        </Button>
      ) : null}
    </Paper>
  )
}

