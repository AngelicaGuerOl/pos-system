import { Container, type ContainerProps } from '@mui/material'

type PageContainerProps = ContainerProps

export const PageContainer = ({ children, sx, ...props }: PageContainerProps) => {
  return (
    <Container
      maxWidth="xl"
      sx={{
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Container>
  )
}

