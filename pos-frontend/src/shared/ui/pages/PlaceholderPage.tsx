import { Paper, Stack, Typography } from '@mui/material'
import { PageHeader } from '../components/PageHeader'

type PlaceholderPageProps = {
  title: string
}

export const PlaceholderPage = ({ title }: PlaceholderPageProps) => {
  return (
    <Stack spacing={3}>
      <PageHeader title={title} />
      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
        <Typography color="text.secondary">
          Este modulo esta preparado para implementarse mas adelante.
        </Typography>
      </Paper>
    </Stack>
  )
}
