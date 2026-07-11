import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import type { PropsWithChildren, ReactNode } from 'react'

type DataGridShellProps = PropsWithChildren<{
  title?: string
  subtitle?: string
  loading?: boolean
  toolbar?: ReactNode
}>

export const DataGridShell = ({
  title,
  subtitle,
  loading = false,
  toolbar,
  children,
}: DataGridShellProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
      }}
    >
      {title || subtitle || toolbar ? (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'stretch', md: 'center' },
            bgcolor: '#f5f7fb',
            borderBottom: 1,
            borderColor: 'divider',
            justifyContent: 'space-between',
            p: 2,
          }}
        >
          {title || subtitle ? (
            <Box>
              {title ? <Typography sx={{ fontSize: 18, fontWeight: 800 }}>{title}</Typography> : null}
              {subtitle ? (
                <Typography color="text.secondary" variant="body2">
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
          ) : null}
          {toolbar}
        </Stack>
      ) : null}

      {loading ? <LinearProgress /> : <Box sx={{ height: 4 }} />}

      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  )
}
