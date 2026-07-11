const TOKEN_STORAGE_KEY = 'pos.auth.token'

export const tokenStorage = {
  getToken(): string | null {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY)
  },

  setToken(token: string): void {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
  },

  removeToken(): void {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
  },
}

