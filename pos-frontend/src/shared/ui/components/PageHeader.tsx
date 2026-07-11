import { Box, Button, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  subtitle?: string
  actionLabel?: string
  actionIcon?: ReactNode
  onAction?: () => void
}

export const PageHeader = ({
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onAction,
}: PageHeaderProps) => {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
    >
      <Box>
        <Typography component="h1" sx={{ fontWeight: 800 }} variant="h4">
          {title}
        </Typography>
        {subtitle ? (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      {actionLabel && onAction ? (
        <Button onClick={onAction} startIcon={actionIcon} variant="contained">
          {actionLabel}
        </Button>
      ) : null}
    </Stack>
  )
}

