// URL base del backend
const API_URL = 'http://localhost:3001';

// ===== HABITACIONES =====
const habitacionesAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/habitaciones`);
    return res.json();
  },

  getById: async (id) => {
    const res = await fetch(`${API_URL}/habitaciones/${id}`);
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(`${API_URL}/habitaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${API_URL}/habitaciones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_URL}/habitaciones/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  }
};

// ===== PAQUETES =====
const paquetesAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/paquetes`);
    return res.json();
  },

  getById: async (id) => {
    const res = await fetch(`${API_URL}/paquetes/${id}`);
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(`${API_URL}/paquetes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${API_URL}/paquetes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_URL}/paquetes/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  }
};

// ===== SERVICIOS =====
const serviciosAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/api/servicios`);
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(`${API_URL}/api/servicios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${API_URL}/api/servicios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_URL}/api/servicios/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  }
};