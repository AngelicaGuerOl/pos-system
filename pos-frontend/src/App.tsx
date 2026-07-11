import './App.css'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="brand">
          <span className="brand-mark">P</span>
          <div>
            <strong>POS System</strong>
            <span>Frontend</span>
          </div>
        </div>

        <nav className="nav-list">
          <a className="nav-item active" href="#sales">Ventas</a>
          <a className="nav-item" href="#catalog">Catalogo</a>
          <a className="nav-item" href="#customers">Clientes</a>
          <a className="nav-item" href="#users">Usuarios</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Entorno de desarrollo</p>
            <h1>Punto de venta</h1>
          </div>
          <span className="status-pill">React + Docker</span>
        </header>

        <section className="summary-grid" aria-label="Resumen">
          <article className="metric-card">
            <span>Ventas de hoy</span>
            <strong>$0.00</strong>
            <small>Listo para conectar al backend</small>
          </article>
          <article className="metric-card">
            <span>Productos</span>
            <strong>0</strong>
            <small>Catalogo pendiente de cargar</small>
          </article>
          <article className="metric-card">
            <span>Clientes</span>
            <strong>0</strong>
            <small>API configurada</small>
          </article>
        </section>

        <section className="panel">
          <div>
            <p className="eyebrow">Conexion API</p>
            <h2>Backend configurado</h2>
            <p>
              El frontend tomara sus peticiones desde la variable
              <code> VITE_API_URL</code>.
            </p>
          </div>

          <code className="api-url">{apiUrl}</code>
        </section>

        <section className="panel muted">
          <h2>Siguiente implementacion</h2>
          <div className="task-list">
            <span>Login JWT</span>
            <span>Catalogo de productos</span>
            <span>Flujo de venta</span>
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
