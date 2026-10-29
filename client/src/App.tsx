export default function App() {
  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="app-title">
        <p className="eyebrow">Masa Madre</p>
        <h1 id="app-title">Orders Masa Madre</h1>
        <p className="status-message">
          Estructura inicial lista. La pantalla de órdenes se implementará en las siguientes etapas.
        </p>
        <a className="health-link" href="/api/health">
          Verificar API
        </a>
      </section>
    </main>
  );
}
