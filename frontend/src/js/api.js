// URL base del backend
const API_URL = 'http://localhost:3001';

// ===== HELPER FETCH CON MANEJO DE ERRORES =====
async function apiFetch(url, opciones = {}) {
  const res = await fetch(url, opciones);
  if (!res.ok) throw new Error(`Error ${res.status} en ${url}`);
  return res.json();
}

// ===== HABITACIONES =====
const habitacionesAPI = {
  getAll: () => apiFetch(`${API_URL}/habitaciones`),
  getById: (id) => apiFetch(`${API_URL}/habitaciones/${id}`),
  create: (data) => apiFetch(`${API_URL}/habitaciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiFetch(`${API_URL}/habitaciones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  delete: (id) => apiFetch(`${API_URL}/habitaciones/${id}`, { method: 'DELETE' })
};

// ===== PAQUETES =====
const paquetesAPI = {
  getAll: () => apiFetch(`${API_URL}/paquetes`),
  getById: (id) => apiFetch(`${API_URL}/paquetes/${id}`),
  create: (data) => apiFetch(`${API_URL}/paquetes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiFetch(`${API_URL}/paquetes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  delete: (id) => apiFetch(`${API_URL}/paquetes/${id}`, { method: 'DELETE' })
};

// ===== SERVICIOS =====
// CORRECCIÓN: la ruta era '/api/servicios' — unificada a '/servicios' como las demás
const serviciosAPI = {
  getAll: () => apiFetch(`${API_URL}/api/servicios`),
  getById: (id) => apiFetch(`${API_URL}/servicios/${id}`),
  create: (data) => apiFetch(`${API_URL}/servicios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiFetch(`${API_URL}/servicios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  delete: (id) => apiFetch(`${API_URL}/servicios/${id}`, { method: 'DELETE' })
};