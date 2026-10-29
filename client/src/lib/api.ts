export type Client = {
  id: number;
  alias: string;
  nombre_completo: string | null;
  email: string | null;
  mobile: string | null;
  direccion: string | null;
  notas: string | null;
};

export type Catalogs = {
  tipos_pan: Array<{ id: number; tipo: string }>;
  ingredientes_adicionales: Array<{ id: number; ingrediente: string }>;
};

export type CatalogItem = { id: number; tipo?: string; ingrediente?: string };

export type Order = {
  id: number;
  cliente_id: number;
  fecha_registro: string;
  fecha_entrega: string;
  hora_entrega: string;
  tipo_pan_id: number;
  ingrediente_adicional_id: number;
  monto_colones: number;
  pagada: boolean;
  activa: boolean;
  cliente: Client;
  tipo_pan: string;
  ingrediente_adicional: string;
};

type ErrorPayload = {
  error?: { message?: string; fields?: Record<string, string> };
};

export class ApiClientError extends Error {
  constructor(message: string, public readonly fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  if (response.status === 204) return null as T;
  const payload = (await response.json()) as { data: T } & ErrorPayload;
  if (!response.ok) {
    throw new ApiClientError(payload.error?.message ?? 'No se pudo completar la solicitud.', payload.error?.fields);
  }
  return payload.data;
}

export const api = {
  getCatalogs: () => request<Catalogs>('/catalogos'),
  getClients: (search = '') => request<Client[]>(`/clientes${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createClient: (body: Partial<Client> & { alias: string }) => request<Client>('/clientes', { method: 'POST', body: JSON.stringify(body) }),
  updateClient: (id: number, body: Partial<Client>) => request<Client>(`/clientes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteClient: (id: number) => request<null>(`/clientes/${id}`, { method: 'DELETE' }),
  createBreadType: (tipo: string) => request<CatalogItem>('/catalogos/tipos-pan', { method: 'POST', body: JSON.stringify({ tipo }) }),
  updateBreadType: (id: number, tipo: string) => request<CatalogItem>(`/catalogos/tipos-pan/${id}`, { method: 'PATCH', body: JSON.stringify({ tipo }) }),
  deleteBreadType: (id: number) => request<null>(`/catalogos/tipos-pan/${id}`, { method: 'DELETE' }),
  createIngredient: (ingrediente: string) => request<CatalogItem>('/catalogos/ingredientes', { method: 'POST', body: JSON.stringify({ ingrediente }) }),
  updateIngredient: (id: number, ingrediente: string) => request<CatalogItem>(`/catalogos/ingredientes/${id}`, { method: 'PATCH', body: JSON.stringify({ ingrediente }) }),
  deleteIngredient: (id: number) => request<null>(`/catalogos/ingredientes/${id}`, { method: 'DELETE' }),
  getActiveOrders: () => request<Order[]>('/ordenes/activas'),
  getHistoryOrders: () => request<Order[]>('/ordenes/historico'),
  getOrder: (id: number) => request<Order>(`/ordenes/${id}`),
  createOrder: (body: Record<string, unknown>) => request<Order>('/ordenes', { method: 'POST', body: JSON.stringify(body) }),
  updateOrder: (id: number, body: Record<string, unknown>) => request<Order>(`/ordenes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  completeOrder: (id: number) => request<Order>(`/ordenes/${id}/completar`, { method: 'PATCH' }),
  deleteOrder: (id: number) => request<null>(`/ordenes/${id}`, { method: 'DELETE' }),
};
