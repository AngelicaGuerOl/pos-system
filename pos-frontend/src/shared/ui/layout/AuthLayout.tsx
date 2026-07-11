import { Box, Container } from '@mui/material'
import type { PropsWithChildren } from 'react'

export const AuthLayout = ({ children }: PropsWithChildren) => {
  return (
    <Box
      component="main"
      sx={{
        alignItems: 'center',
        bgcolor: 'background.default',
        display: 'flex',
        minHeight: '100vh',
        px: 2,
        py: 4,
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {children}
      </Container>
    </Box>
  )
}

