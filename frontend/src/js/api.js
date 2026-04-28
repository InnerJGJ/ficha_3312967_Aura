// URL base del backend
const API_URL = 'http://localhost:3001';

// ===== HABITACIONES =====
const habitacionesAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/api/habitaciones`);
    return res.json();
  },

  getById: async (id) => {
    const res = await fetch(`${API_URL}/api/habitaciones/${id}`);
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(`${API_URL}/api/habitaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${API_URL}/api/habitaciones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_URL}/api/habitaciones/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  }
};

// ===== PAQUETES =====
const paquetesAPI = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/api/paquetes`);
    return res.json();
  },

  getById: async (id) => {
    const res = await fetch(`${API_URL}/api/paquetes/${id}`);
    return res.json();
  },

  create: async (data) => {
    const res = await fetch(`${API_URL}/api/paquetes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${API_URL}/api/paquetes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${API_URL}/api/paquetes/${id}`, {
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