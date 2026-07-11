import AddCardRoundedIcon from '@mui/icons-material/AddCardRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Stack,
  TextField,
} from '@mui/material'
import { useMemo, useRef, useState } from 'react'
import { useAuth } from '../../../../auth'
import { ConfirmDialog } from '../../../../../shared/ui/components/ConfirmDialog'
import type { Category, CategoryMutation } from '../../domain/entities/Category'
import { CategoriesGrid } from '../components/CategoriesGrid'
import { CategoryModal } from '../components/CategoryModal'
import { useCategories } from '../hooks/useCategories'
import { useCreateCategory } from '../hooks/useCreateCategory'
import { useDeactivateCategory } from '../hooks/useDeactivateCategory'
import { useUpdateCategory } from '../hooks/useUpdateCategory'

type ModalState =
  | { open: false; mode: 'create'; category: null }
  | { open: true; mode: 'create'; category: null }
  | { open: true; mode: 'edit'; category: Category }

export const CategoriesPage = () => {
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN'
  const [modal, setModal] = useState<ModalState>({ category: null, mode: 'create', open: false })
  const [categoryToDeactivate, setCategoryToDeactivate] = useState<Category | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const debounceTimeout = useRef<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { categories, error, loading, refetch, search, setSearch } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deactivateCategory = useDeactivateCategory()

  const mutationError = useMemo(
    () => createCategory.error ?? updateCategory.error ?? deactivateCategory.error,
    [createCategory.error, deactivateCategory.error, updateCategory.error],
  )

  const mutationLoading =
    createCategory.loading || updateCategory.loading || deactivateCategory.loading

  const handleSubmit = async (values: CategoryMutation) => {
    const result =
      modal.mode === 'create'
        ? await createCategory.createCategory(values)
        : await updateCategory.updateCategory(modal.category.id, values)

    if (!result) {
      return
    }

    setModal({ category: null, mode: 'create', open: false })
    setMessage(modal.mode === 'create' ? 'Categoria creada' : 'Categoria actualizada')
    await refetch()
  }

  const handleDeactivate = async () => {
    if (!categoryToDeactivate) {
      return
    }

    const success = await deactivateCategory.deactivateCategory(categoryToDeactivate.id)

    if (success) {
      setMessage('Categoria desactivada')
      setCategoryToDeactivate(null)
      await refetch()
    }
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)

    if (debounceTimeout.current) {
      window.clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = window.setTimeout(() => {
      void refetch(value)
    }, 400)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, mb: 2 }}
      >
        {canManage ? (
          <Button
            onClick={() => setModal({ category: null, mode: 'create', open: true })}
            startIcon={<AddCardRoundedIcon />}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            variant="contained"
          >
            Agregar categoria
          </Button>
        ) : null}

        {loading ? <CircularProgress size={24} sx={{ ml: { sm: 1 } }} /> : null}

        <Box sx={{ flexGrow: { xs: 0, sm: 1 } }} />

        <TextField
          inputRef={searchInputRef}
          label="Buscar por nombre"
          onChange={(event) => handleSearchChange(event.target.value)}
          size="small"
          sx={{ minWidth: { xs: '100%', sm: 300 } }}
          value={search}
        />
      </Stack>

      <Stack spacing={2}>
        {error ? <Alert severity="error">{error.message}</Alert> : null}
        {mutationError ? <Alert severity="error">{mutationError.message}</Alert> : null}

        <CategoriesGrid
          canManage={canManage}
          categories={categories}
          loading={loading}
          onDeactivate={setCategoryToDeactivate}
          onEdit={(category) => setModal({ category, mode: 'edit', open: true })}
        />
      </Stack>

      <CategoryModal
        initialData={modal.category}
        loading={mutationLoading}
        mode={modal.mode}
        onClose={() => setModal({ category: null, mode: 'create', open: false })}
        onSubmit={handleSubmit}
        open={modal.open}
      />

      <ConfirmDialog
        confirmText="Desactivar"
        loading={deactivateCategory.loading}
        message={`La categoria "${categoryToDeactivate?.name ?? ''}" dejara de estar disponible.`}
        onCancel={() => setCategoryToDeactivate(null)}
        onConfirm={handleDeactivate}
        open={Boolean(categoryToDeactivate)}
        title="Desactivar categoria"
      />

      <Snackbar
        autoHideDuration={3000}
        onClose={() => setMessage(null)}
        open={Boolean(message)}
      >
        <Alert onClose={() => setMessage(null)} severity="success" variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
