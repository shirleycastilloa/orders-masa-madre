import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, ApiClientError, Catalogs, Client, Order } from './lib/api';
import { formatAmountInput, formatCurrency, formatDate, formatMonth, formatTime, parseAmount } from './lib/format';

type Route = { page: 'home' | 'new' | 'detail' | 'history'; id?: number };

function readRoute(): Route {
  const value = window.location.hash.replace(/^#/, '') || '/';
  if (value === '/historial') return { page: 'history' };
  if (value === '/ordenes/nueva') return { page: 'new' };
  const detail = value.match(/^\/ordenes\/(\d+)(?:\/editar)?$/);
  if (detail) return { page: 'detail', id: Number(detail[1]) };
  return { page: 'home' };
}

function navigate(path: string) {
  window.location.hash = path;
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  return <div className="alert alert-error">{error instanceof Error ? error.message : 'Ocurrió un error.'}</div>;
}

function Loading({ label = 'Cargando…' }: { label?: string }) {
  return <div className="state-message"><span className="spinner" aria-hidden="true" />{label}</div>;
}

function Header({ title, onBack }: { title?: string; onBack?: () => void }) {
  return <header className="app-header">
    <div className="brand-lockup">
      {onBack ? <button className="icon-button" onClick={onBack} aria-label="Volver">←</button> : null}
      <div><p className="brand-kicker">Masa Madre</p><h1>{title ?? 'Órdenes activas'}</h1></div>
    </div>
    {!onBack ? <span className="breadmark" aria-hidden="true">✦</span> : null}
  </header>;
}

function TopActions() {
  return <div className="top-actions">
    <button className="button button-primary" onClick={() => navigate('/ordenes/nueva')}>+ Registrar orden</button>
    <button className="button button-secondary" onClick={() => navigate('/historial')}>Histórico</button>
  </div>;
}

function PaymentBadge({ paid }: { paid: boolean }) {
  return <span className={`payment-badge ${paid ? 'is-paid' : 'is-pending'}`}><span aria-hidden="true">{paid ? '✓' : '○'}</span>{paid ? 'Pagada' : 'Pendiente'}</span>;
}

function OrderCard({ order }: { order: Order }) {
  return <button className="order-card" onClick={() => navigate(`/ordenes/${order.id}`)}>
    <div className="order-card-top"><span className="order-alias">{order.cliente.alias}</span><PaymentBadge paid={order.pagada} /></div>
    <div className="order-date-row"><span>{formatDate(order.fecha_entrega)}</span><strong>{formatTime(order.hora_entrega)}</strong></div>
    <div className="order-detail-row"><span>{order.tipo_pan}</span><span>{order.ingrediente_adicional}</span></div>
    <div className="order-card-bottom"><span className="muted-label">Monto a pagar</span><strong className="amount">{formatCurrency(order.monto_colones)}</strong></div>
    <span className="card-chevron" aria-hidden="true">›</span>
  </button>;
}

function GroupedOrders({ orders }: { orders: Order[] }) {
  const groups = useMemo(() => {
    const grouped = new Map<string, Order[]>();
    for (const order of orders) {
      const key = order.fecha_entrega.slice(0, 7);
      grouped.set(key, [...(grouped.get(key) ?? []), order]);
    }
    return [...grouped.entries()];
  }, [orders]);
  return <div className="order-groups">{groups.map(([key, groupedOrders]) => <section className="order-group" key={key}><h2>{formatMonth(groupedOrders[0].fecha_entrega)}</h2>{groupedOrders.map((order) => <OrderCard key={order.id} order={order} />)}</section>)}</div>;
}

function HomePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => { api.getActiveOrders().then(setOrders).catch(setError).finally(() => setLoading(false)); }, []);
  return <div className="page"><Header /><TopActions /><main className="page-content">
    {loading ? <Loading /> : <ErrorMessage error={error} />}
    {!loading && !error && orders.length === 0 ? <div className="empty-state"><div className="empty-icon">✦</div><h2>No hay órdenes activas</h2><p>Registra la primera orden para comenzar a organizar tus entregas.</p><button className="button button-primary" onClick={() => navigate('/ordenes/nueva')}>Registrar orden</button></div> : null}
    {!loading && !error && orders.length > 0 ? <GroupedOrders orders={orders} /> : null}
  </main></div>;
}

function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => { api.getHistoryOrders().then(setOrders).catch(setError).finally(() => setLoading(false)); }, []);
  const groups = useMemo(() => {
    const grouped = new Map<string, Order[]>();
    for (const order of orders) {
      const key = order.fecha_registro.slice(0, 7);
      grouped.set(key, [...(grouped.get(key) ?? []), order]);
    }
    return [...grouped.entries()];
  }, [orders]);
  return <div className="page"><Header title="Histórico" onBack={() => navigate('/')} /><main className="page-content">
    <div className="section-intro"><p>Órdenes completadas, agrupadas por fecha de registro.</p><button className="button button-primary button-small" onClick={() => navigate('/ordenes/nueva')}>+ Nueva orden</button></div>
    {loading ? <Loading /> : <ErrorMessage error={error} />}
    {!loading && !error && orders.length === 0 ? <div className="empty-state compact"><h2>Histórico vacío</h2><p>Las órdenes completadas aparecerán aquí.</p></div> : null}
    {!loading && !error ? <div className="order-groups history-groups">{groups.map(([key, groupedOrders]) => <section className="order-group" key={key}><h2>{formatMonth(`${key}-01`)}</h2>{groupedOrders.map((order) => <OrderCard key={order.id} order={order} />)}</section>)}</div> : null}
  </main></div>;
}

type OrderFormValues = { cliente_id: string; fecha_entrega: string; hora_entrega: string; tipo_pan_id: string; ingrediente_adicional_id: string; monto_colones: string; pagada: boolean };

function initialForm(order?: Order): OrderFormValues {
  return order ? { cliente_id: String(order.cliente_id), fecha_entrega: order.fecha_entrega, hora_entrega: order.hora_entrega, tipo_pan_id: String(order.tipo_pan_id), ingrediente_adicional_id: String(order.ingrediente_adicional_id), monto_colones: formatAmountInput(String(order.monto_colones)), pagada: order.pagada } : { cliente_id: '', fecha_entrega: today(), hora_entrega: '09:00', tipo_pan_id: '', ingrediente_adicional_id: '', monto_colones: '', pagada: false };
}

function InlineClientForm({ onCreated }: { onCreated: (client: Client) => void }) {
  const [alias, setAlias] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(null);
    try { const client = await api.createClient({ alias, nombre_completo: name }); onCreated(client); setAlias(''); setName(''); } catch (submitError) { setError(submitError); } finally { setSaving(false); }
  }
  return <form className="inline-client-form" onSubmit={submit}>
    <div className="inline-form-heading"><strong>Nuevo cliente</strong><span>Solo el alias es obligatorio</span></div>
    <div className="form-grid two-columns"><label>Alias<input value={alias} onChange={(event) => setAlias(event.target.value)} required /></label><label>Nombre completo<input value={name} onChange={(event) => setName(event.target.value)} /></label></div>
    <ErrorMessage error={error} /><button className="button button-secondary button-small" disabled={saving}>{saving ? 'Guardando…' : 'Crear cliente'}</button>
  </form>;
}

function OrderFormPage({ order }: { order?: Order }) {
  const editing = Boolean(order);
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [values, setValues] = useState<OrderFormValues>(() => initialForm(order));
  const [clientSearch, setClientSearch] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [loading, setLoading] = useState(!order);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  useEffect(() => { Promise.all([api.getCatalogs(), api.getClients()]).then(([catalogData, clientData]) => { setCatalogs(catalogData); setClients(clientData); }).catch(setError).finally(() => setLoading(false)); }, []);
  const filteredClients = clients.filter((client) => `${client.alias} ${client.nombre_completo ?? ''}`.toLowerCase().includes(clientSearch.toLowerCase()));
  const update = (key: keyof OrderFormValues, value: string | boolean) => setValues((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(null); setFieldErrors({});
    const body = { cliente_id: Number(values.cliente_id), fecha_entrega: values.fecha_entrega, hora_entrega: values.hora_entrega, tipo_pan_id: Number(values.tipo_pan_id), ingrediente_adicional_id: Number(values.ingrediente_adicional_id), monto_colones: parseAmount(values.monto_colones), pagada: values.pagada };
    try { const saved = editing ? await api.updateOrder(order!.id, body) : await api.createOrder(body); navigate(`/ordenes/${saved.id}`); } catch (submitError) { setError(submitError); if (submitError instanceof ApiClientError && submitError.fields) setFieldErrors(submitError.fields); } finally { setSaving(false); }
  }
  function handleClientCreated(client: Client) { setClients((current) => [...current, client].sort((a, b) => a.alias.localeCompare(b.alias))); update('cliente_id', String(client.id)); setShowNewClient(false); }
  if (loading) return <div className="page"><Header title={editing ? 'Editar orden' : 'Registrar orden'} onBack={() => navigate(editing ? `/ordenes/${order!.id}` : '/')} /><main className="page-content"><Loading /></main></div>;
  if (!catalogs) return <div className="page"><Header title="Registrar orden" onBack={() => navigate('/')} /><main className="page-content"><ErrorMessage error={error} /></main></div>;
  return <div className="page"><Header title={editing ? 'Editar orden' : 'Registrar orden'} onBack={() => navigate(editing ? `/ordenes/${order!.id}` : '/')} /><main className="page-content">
    <form className="order-form" onSubmit={submit}>
      {editing ? <div className="read-only-info"><span>Orden #{order!.id}</span><span>Registrada el {formatDate(order!.fecha_registro)}</span></div> : null}
      <label>Cliente<select value={values.cliente_id} onChange={(event) => update('cliente_id', event.target.value)} required><option value="">Selecciona un cliente</option>{filteredClients.map((client) => <option key={client.id} value={client.id}>{client.alias}{client.nombre_completo ? ` — ${client.nombre_completo}` : ''}</option>)}</select></label>
      <div className="search-row"><input aria-label="Buscar cliente" placeholder="Buscar cliente…" value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} /><button type="button" className="button button-secondary button-small" onClick={() => setShowNewClient((current) => !current)}>{showNewClient ? 'Cerrar' : '+ Nuevo'}</button></div>
      {showNewClient ? <InlineClientForm onCreated={handleClientCreated} /> : null}
      <div className="form-grid two-columns"><label>Fecha de entrega<input type="date" value={values.fecha_entrega} onChange={(event) => update('fecha_entrega', event.target.value)} required />{fieldErrors.fecha_entrega ? <small className="field-error">{fieldErrors.fecha_entrega}</small> : null}</label><label>Hora de entrega<input type="time" value={values.hora_entrega} onChange={(event) => update('hora_entrega', event.target.value)} required /><small className="field-hint">Se mostrará en formato am/pm</small></label></div>
      <div className="form-grid two-columns"><label>Tipo de pan<select value={values.tipo_pan_id} onChange={(event) => update('tipo_pan_id', event.target.value)} required><option value="">Selecciona</option>{catalogs.tipos_pan.map((item) => <option key={item.id} value={item.id}>{item.tipo}</option>)}</select></label><label>Ingredientes adicionales<select value={values.ingrediente_adicional_id} onChange={(event) => update('ingrediente_adicional_id', event.target.value)} required><option value="">Selecciona</option>{catalogs.ingredientes_adicionales.map((item) => <option key={item.id} value={item.id}>{item.ingrediente}</option>)}</select></label></div>
      <label>Monto a pagar<input inputMode="numeric" value={values.monto_colones} onChange={(event) => update('monto_colones', formatAmountInput(event.target.value))} placeholder="0" required /><small className="field-hint">Colones, sin decimales</small></label>
      <label className="checkbox-row"><input type="checkbox" checked={values.pagada} onChange={(event) => update('pagada', event.target.checked)} /><span>¿Ya pagó?</span></label>
      <ErrorMessage error={error} />
      <div className="form-actions"><button type="button" className="button button-secondary" onClick={() => navigate(editing ? `/ordenes/${order!.id}` : '/')}>Cancelar</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar orden'}</button></div>
    </form>
  </main></div>;
}

function DetailPage({ id }: { id: number }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const [actionLoading, setActionLoading] = useState(false);
  useEffect(() => { api.getOrder(id).then(setOrder).catch(setError).finally(() => setLoading(false)); }, [id]);
  async function complete() { if (!order || !window.confirm('¿Marcar esta orden como completada?')) return; setActionLoading(true); setActionError(null); try { setOrder(await api.completeOrder(order.id)); } catch (action) { setActionError(action); } finally { setActionLoading(false); } }
  async function remove() { if (!order || !window.confirm('Esta acción eliminará la orden permanentemente. ¿Deseas continuar?')) return; setActionLoading(true); setActionError(null); try { await api.deleteOrder(order.id); navigate('/'); } catch (action) { setActionError(action); setActionLoading(false); } }
  if (loading) return <div className="page"><Header title="Detalle de orden" onBack={() => navigate('/')} /><main className="page-content"><Loading /></main></div>;
  if (!order) return <div className="page"><Header title="Orden no encontrada" onBack={() => navigate('/')} /><main className="page-content"><ErrorMessage error={error ?? new Error('La orden no existe.')} /></main></div>;
  return <div className="page"><Header title={`Orden #${order.id}`} onBack={() => navigate(order.activa ? '/' : '/historial')} /><main className="page-content detail-content">
    <div className="detail-status"><span className={`status-pill ${order.activa ? 'active' : 'completed'}`}>{order.activa ? 'Activa' : 'Completada'}</span><PaymentBadge paid={order.pagada} /></div>
    <section className="detail-card"><div className="detail-hero"><span className="detail-alias">{order.cliente.alias}</span><strong>{formatCurrency(order.monto_colones)}</strong></div><dl className="detail-list"><div><dt>Cliente</dt><dd>{order.cliente.nombre_completo || order.cliente.alias}</dd></div><div><dt>Fecha de registro</dt><dd>{formatDate(order.fecha_registro)}</dd></div><div><dt>Fecha de entrega</dt><dd>{formatDate(order.fecha_entrega)}</dd></div><div><dt>Hora de entrega</dt><dd>{formatTime(order.hora_entrega)}</dd></div><div><dt>Tipo de pan</dt><dd>{order.tipo_pan}</dd></div><div><dt>Ingredientes adicionales</dt><dd>{order.ingrediente_adicional}</dd></div><div><dt>Estado de pago</dt><dd>{order.pagada ? 'Pagada' : 'Pendiente'}</dd></div></dl></section>
    <ErrorMessage error={actionError} />
    <div className="detail-actions"><button className="button button-primary" onClick={() => navigate(`/ordenes/${order.id}/editar`)} disabled={actionLoading}>Editar orden</button>{order.activa ? <button className="button button-secondary" onClick={complete} disabled={actionLoading}>{actionLoading ? 'Procesando…' : 'Marcar completada'}</button> : null}<button className="button button-danger" onClick={remove} disabled={actionLoading}>Eliminar orden</button></div>
  </main></div>;
}

function EditOrderPage({ id }: { id: number }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => { api.getOrder(id).then(setOrder).catch(setError); }, [id]);
  if (error) return <div className="page"><Header title="Editar orden" onBack={() => navigate(`/ordenes/${id}`)} /><main className="page-content"><ErrorMessage error={error} /></main></div>;
  if (!order) return <div className="page"><Header title="Editar orden" onBack={() => navigate(`/ordenes/${id}`)} /><main className="page-content"><Loading /></main></div>;
  return <OrderFormPage order={order} />;
}

function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  useEffect(() => { const handleHash = () => setRoute(readRoute()); window.addEventListener('hashchange', handleHash); return () => window.removeEventListener('hashchange', handleHash); }, []);
  if (route.page === 'home') return <HomePage />;
  if (route.page === 'history') return <HistoryPage />;
  if (route.page === 'new') return <OrderFormPage />;
  if (route.page === 'detail' && route.id) return window.location.hash.endsWith('/editar') ? <EditOrderPage id={route.id} /> : <DetailPage id={route.id} />;
  return <HomePage />;
}

export default App;



