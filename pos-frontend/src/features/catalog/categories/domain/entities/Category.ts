export type Category = {
  id: number
  name: string
  description: string | null
  active: boolean
  createdAt: string
  updatedAt: string | null
}

export type CategoryMutation = {
  name: string
  description?: string | null
}

