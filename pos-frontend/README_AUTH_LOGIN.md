# Modulo de login JWT del POS Frontend

Este documento explica lo implementado para el login del frontend en React + TypeScript + Vite.

## Objetivo

Implementar autenticacion con JWT contra el backend Spring Boot:

- Login con `POST /api/auth/login`.
- Consulta de sesion con `GET /api/auth/me`.
- Guardado centralizado del token.
- Rutas publicas y protegidas.
- UI profesional con Material UI.
- Formulario validado con React Hook Form + Zod.
- HTTP centralizado con Axios.

## Arquitectura

La estructura implementada separa responsabilidades:

```text
src
├── app
│   ├── config
│   ├── providers
│   └── router
├── features
│   └── auth
│       ├── application
│       ├── domain
│       ├── infrastructure
│       └── ui
└── shared
    ├── api
    ├── lib
    ├── routes
    └── ui
```

## Flujo de login

1. El usuario entra a `/login`.
2. `PublicRoute` permite entrar si no hay sesion.
3. `LoginPage` renderiza `AuthLayout` y `LoginForm`.
4. `LoginForm` usa `useLogin`.
5. `useLogin` valida con React Hook Form + Zod.
6. `useLogin` llama a `login` desde `useAuth`.
7. `useAuth` ejecuta `LoginUseCase`.
8. `LoginUseCase` usa `AuthRepository`.
9. `AuthRepositoryImpl` hace `POST /auth/login` con Axios.
10. El backend responde token y usuario.
11. `tokenStorage` guarda el token.
12. `AuthMapper` transforma la respuesta a entidad `User`.
13. Se guarda el usuario en el contexto.
14. React Router redirige a `/dashboard`.

Con:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

La llamada:

```ts
this.client.post('/auth/login', ...)
```

termina llamando:

```text
http://localhost:8080/api/auth/login
```

## Archivos principales

### `src/app/config/env.ts`

Centraliza variables de entorno:

```ts
export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, ''),
} as const
```

Conceptos:

- `import.meta.env`: variables de Vite.
- `??`: fallback si la variable no existe.
- `replace(/\/$/, '')`: elimina slash final.
- `as const`: mantiene el valor como constante literal.

### `src/shared/api/httpClient.ts`

Cliente Axios global.

Responsabilidades:

- Configurar `baseURL`.
- Enviar `Accept` y `Content-Type`.
- Configurar timeout.
- Agregar JWT en `Authorization`.
- No mandar token al login.
- Reintentar errores de red.
- Borrar token y redirigir si hay `401` fuera de login.

Conceptos:

- Axios instance: cliente HTTP reutilizable.
- Request interceptor: corre antes de enviar la peticion.
- Response interceptor: corre al recibir respuesta o error.
- `Promise.reject`: propaga el error para que la UI lo maneje.

### `src/shared/api/apiError.ts`

Normaliza errores del backend.

Convierte errores Axios o errores desconocidos en:

```ts
type NormalizedApiError = {
  status?: number
  message: string
  validationErrors?: Record<string, string>
}
```

Esto permite que la UI muestre mensajes claros para:

- backend apagado.
- endpoint no encontrado.
- credenciales incorrectas.
- errores de validacion.
- errores del servidor.

### `src/shared/lib/storage/tokenStorage.ts`

Centraliza acceso al token:

- `getToken()`
- `setToken(token)`
- `removeToken()`

Los componentes no usan `localStorage` directamente.

### `src/features/auth/domain/entities/User.ts`

Entidad interna:

```ts
export type UserRole = 'ADMIN' | 'CASHIER'

export type User = {
  id: number
  username: string
  role: UserRole
}
```

`UserRole` restringe los roles permitidos.

### `src/features/auth/domain/repositories/AuthRepository.ts`

Contrato del repositorio:

```ts
export type AuthRepository = {
  login(username: string, password: string): Promise<User>
  getCurrentUser(): Promise<User>
  logout(): Promise<void>
}
```

No conoce React, Axios ni Material UI.

### `src/features/auth/infrastructure/AuthRepositoryImpl.ts`

Implementa el repositorio usando Axios.

- `login`: llama `/auth/login`, guarda token y devuelve usuario.
- `getCurrentUser`: llama `/auth/me`.
- `logout`: elimina token.

### `src/features/auth/infrastructure/mappers/AuthMapper.ts`

Mapea la respuesta del backend al modelo interno.

Si cambia el JSON del backend, se ajusta este archivo y no toda la app.

### `src/features/auth/application/useCases/*.ts`

Casos de uso:

- `LoginUseCase`
- `LogoutUseCase`
- `GetCurrentUserUseCase`

No tienen React ni Axios. Solo coordinan acciones del repositorio.

### `src/features/auth/dependencies.ts`

Crea las instancias:

- `AuthRepositoryImpl`
- `LoginUseCase`
- `LogoutUseCase`
- `GetCurrentUserUseCase`

Evita crear dependencias dentro de componentes.

### `src/features/auth/ui/schemas/loginSchema.ts`

Schema Zod:

- usuario requerido.
- contrasena requerida.
- contrasena minimo 8 caracteres.

`z.infer` genera el tipo TypeScript desde el schema.

### `src/features/auth/ui/hooks/useLogin.ts`

Hook del formulario.

Responsabilidades:

- Crear formulario con React Hook Form.
- Usar `zodResolver`.
- Ejecutar login.
- Manejar loading.
- Manejar errores.
- Redirigir a `/dashboard`.

No hace HTTP directo.

### `src/features/auth/ui/hooks/useAuth.ts`

Contexto global de autenticacion.

Expone:

- `user`
- `isAuthenticated`
- `loading`
- `login`
- `logout`
- `refreshCurrentUser`

Al cargar la app, si hay token, consulta `/auth/me`.

### `src/features/auth/ui/hooks/useCurrentUser.ts`

Hook reusable para consultar usuario actual usando el caso de uso.

### `src/features/auth/ui/components/LoginForm.tsx`

UI del login con Material UI.

Componentes usados:

- `Paper`
- `TextField`
- `Button`
- `Alert`
- `CircularProgress`
- `Box`
- `Stack`
- `Typography`
- iconos de MUI

No guarda token ni llama Axios.

### `src/features/auth/ui/pages/LoginPage.tsx`

Pagina del login.

Solo compone:

- `AuthLayout`
- `LoginForm`

### `src/shared/routes/ProtectedRoute.tsx`

Protege rutas privadas.

Si no hay sesion, redirige a `/login`.

### `src/shared/routes/PublicRoute.tsx`

Protege rutas publicas.

Si ya hay sesion, redirige a `/dashboard`.

### `src/shared/routes/routePaths.ts`

Centraliza rutas:

```ts
export const ROUTE_PATHS = {
  login: '/login',
  dashboard: '/dashboard',
} as const
```

### `src/shared/ui/layout/AuthLayout.tsx`

Layout centrado para pantallas de autenticacion.

### `src/shared/ui/layout/DashboardLayout.tsx`

Layout basico despues del login.

Incluye boton de logout.

### `src/shared/ui/pages/DashboardPage.tsx`

Pagina temporal del dashboard.

No implementa productos, clientes ni ventas.

### `src/app/router/routes.tsx`

Define rutas:

- `/login`
- `/dashboard`
- comodin `*`

### `src/app/router/AppRouter.tsx`

Renderiza rutas con `useRoutes`.

### `src/app/providers/AppProviders.tsx`

Configura:

- `ThemeProvider`
- `CssBaseline`
- `BrowserRouter`
- `AuthProvider`

### `src/App.tsx`

Renderiza `AppRouter`.

### `src/main.tsx`

Arranca React con `createRoot` y envuelve la app con providers.

## Conceptos de React usados

### Componente

Funcion que devuelve TSX.

```tsx
export const LoginPage = () => {
  return <LoginForm />
}
```

### Hook

Funcion que encapsula estado o logica reusable.

Ejemplos:

- `useLogin`
- `useAuth`
- `useCurrentUser`

### Context

Permite compartir sesion en toda la app sin pasar props manualmente.

### `useState`

Guarda estado local.

### `useEffect`

Ejecuta efectos, por ejemplo validar sesion al cargar.

### `useCallback`

Mantiene funciones estables entre renders.

### `useMemo`

Evita recrear objetos si sus dependencias no cambiaron.

## Conceptos de TypeScript usados

### Union type

```ts
type UserRole = 'ADMIN' | 'CASHIER'
```

Solo acepta esos valores.

### Type alias

```ts
type User = {
  id: number
  username: string
}
```

Define la forma de un objeto.

### Genericos

```ts
this.client.post<BackendLoginResponse>(...)
```

Le dice a Axios que tipo tiene `data`.

### `Promise<T>`

Representa una operacion asincrona que devuelve `T`.

### `async/await`

Permite esperar operaciones asincronas de forma legible.

### `import type`

Importa solo tipos, sin generar codigo JavaScript.

## Conceptos de Axios usados

### `axios.create`

Crea una instancia configurable.

### Request interceptor

Agrega token automaticamente antes de enviar una peticion.

### Response interceptor

Maneja errores globales, como token expirado.

### Timeout

Corta una peticion si tarda demasiado.

### Retry

Reintenta errores de red hasta 2 veces.

## Como probar

1. Configura:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

2. Levanta backend.

3. Levanta frontend:

```bash
npm run dev
```

4. Entra a:

```text
http://localhost:5173/login
```

5. Usa un usuario real del backend.

Si usas bootstrap admin:

```text
Usuario: admin
Contrasena: la configurada en BOOTSTRAP_ADMIN_PASSWORD
```

## Errores comunes

### 404

Endpoint no encontrado. Revisar:

- backend encendido.
- `VITE_API_BASE_URL`.
- endpoint `/api/auth/login`.

### 401 en login

Credenciales incorrectas.

### 401 fuera de login

Token invalido o expirado. El frontend borra token y vuelve a `/login`.

### Sin respuesta

Backend apagado o URL incorrecta.

## Validacion tecnica

Se valido con:

```bash
npm run build
npm run lint
```

Ambos comandos pasan correctamente.
