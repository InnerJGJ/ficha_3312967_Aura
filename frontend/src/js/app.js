// ===== VARIABLES GLOBALES PARA PAGINACIÓN =====
let paginaActual = 1;
const itemsPorPagina = 6;
let datosOriginales = [];
let datosFiltrados  = [];
let tipoModuloActual = '';

// ===== CARGAR HEADER Y FOOTER =====
async function cargarComponentes() {
  try {
    const base = window.location.pathname.includes('/pages/') ? '../' : 'src/';

    const headerRes = await fetch(`${base}components/header.html`);
    document.getElementById('header-container').innerHTML = await headerRes.text();
    if (window.lucide) lucide.createIcons();
    inicializarSidebar();
    marcarNavActivo();

    const footerRes = await fetch(`${base}components/footer.html`);
    document.getElementById('footer-container').innerHTML = await footerRes.text();

  } catch (error) {
    console.error('Error cargando componentes:', error);
  }
}

// ===== SIDEBAR =====
function inicializarSidebar() {
  const sidebar     = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const btnCol      = document.getElementById('sidebarColapsar');
  const btnToggle   = document.getElementById('sidebarToggle');
  const overlay     = document.getElementById('sidebarOverlay');
  const COLLAPSED_KEY = 'sidebar_collapsed';

  function applyCollapsed(collapsed) {
    if (!sidebar || !btnCol) return;
    sidebar.classList.toggle('sidebar--colapsado', collapsed);
    if (mainContent) mainContent.classList.toggle('main-content--expandido', collapsed);
    btnCol.innerHTML = collapsed
      ? '<i data-lucide="chevron-right"></i>'
      : '<i data-lucide="chevron-left"></i>';
    if (window.lucide) lucide.createIcons();
  }

  applyCollapsed(localStorage.getItem(COLLAPSED_KEY) === 'true');

  btnCol?.addEventListener('click', () => {
    const nowCollapsed = !sidebar.classList.contains('sidebar--colapsado');
    localStorage.setItem(COLLAPSED_KEY, nowCollapsed);
    applyCollapsed(nowCollapsed);
  });

  btnToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar--abierto');
    overlay?.classList.toggle('activo');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('sidebar--abierto');
    overlay.classList.remove('activo');
  });
}

// ===== MARCAR ENLACE ACTIVO EN NAV =====
function marcarNavActivo() {
  const pathActual = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href !== '/' && pathActual.includes(href)) {
      link.classList.add('activo');
    }
  });
}

// ===== PAGINACIÓN =====
function renderizarPagina() {
  const container = document.getElementById(`${tipoModuloActual}-container`);
  if (!container) return;

  const inicio = (paginaActual - 1) * itemsPorPagina;
  const items  = datosFiltrados.slice(inicio, inicio + itemsPorPagina);

  if (items.length === 0) {
    container.innerHTML = `<p class="loading">No se encontraron ${tipoModuloActual}.</p>`;
    renderPaginacion(0);
    return;
  }

  const templateMap = {
    habitaciones: templateHabitacion,
    paquetes:     templatePaquete,
    servicios:    templateServicio,
  };

  container.innerHTML = items.map(templateMap[tipoModuloActual]).join('');
  renderPaginacion(datosFiltrados.length);
}

function renderPaginacion(totalItems) {
  const nav = document.getElementById('paginacion');
  if (!nav) return;

  const totalPaginas = Math.ceil(totalItems / itemsPorPagina);
  nav.innerHTML = '';

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement('button');
    btn.innerText = i;
    if (i === paginaActual) btn.classList.add('active');
    btn.onclick = () => {
      paginaActual = i;
      renderizarPagina();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    nav.appendChild(btn);
  }
}

// ===== TEMPLATES PÁGINAS INTERNAS (con botones admin) =====
function templateHabitacion(hab) {
  const itemJson = JSON.stringify(hab).replace(/"/g, '&quot;');
  return `
    <div class="card">
      ${hab.imagen
        ? `<img src="${hab.imagen}" class="card__imagen" alt="${hab.NombreHabitacion || hab.tipo}" onerror="this.src='../assets/placeholder.jpg'">`
        : `<div class="card__imagen" style="background:var(--color-acento);display:flex;align-items:center;justify-content:center;font-size:3rem">🛏️</div>`
      }
      <div class="card__contenido">
        <h3 class="card__titulo">${hab.NombreHabitacion || hab.tipo || 'Habitación'}</h3>
        <p class="card__precio">$${Number(hab.precio || 0).toLocaleString('es-CO')} / noche</p>
        <p class="card__descripcion">${hab.descripcion || 'Habitación confortable.'}</p>
        <div class="card__acciones">
          <button class="btn btn-secundario" onclick="mostrarDetalles(${itemJson}, 'Habitación')">Detalles</button>
          <button class="btn btn-primario"   onclick="editarHabitacion('${hab.IDHabitacion}','${hab.NombreHabitacion || hab.tipo}',${hab.precio},'${hab.descripcion || ''}','${hab.imagen || ''}')">Editar</button>
          <button class="btn btn-peligro"    onclick="eliminarHabitacion('${hab.IDHabitacion}')">Borrar</button>
        </div>
      </div>
    </div>`;
}

function templatePaquete(paq) {
  const itemJson = JSON.stringify(paq).replace(/"/g, '&quot;');
  return `
    <div class="card">
      ${paq.imagen
        ? `<img src="${paq.imagen}" class="card__imagen" alt="${paq.nombre}" onerror="this.src='../assets/placeholder.jpg'">`
        : `<div class="card__imagen" style="background:var(--color-primario);display:flex;align-items:center;justify-content:center;font-size:3rem">✈️</div>`
      }
      <div class="card__contenido">
        <h3 class="card__titulo">${paq.nombre || 'Paquete'}</h3>
        <p class="card__precio">$${Number(paq.Precio || paq.precio || 0).toLocaleString('es-CO')}</p>
        <p class="card__descripcion">${paq.Descripcion || paq.descripcion || 'Paquete especial.'}</p>
        <div class="card__acciones">
          <button class="btn btn-secundario" onclick="mostrarDetalles(${itemJson}, 'Paquete')">Detalles</button>
          <button class="btn btn-primario"   onclick="editarPaquete('${paq.IDPaquete}','${paq.nombre}',${paq.Precio || 0},'${paq.Descripcion || ''}','${paq.imagen || ''}')">Editar</button>
          <button class="btn btn-peligro"    onclick="eliminarPaquete('${paq.IDPaquete}')">Borrar</button>
        </div>
      </div>
    </div>`;
}

function templateServicio(ser) {
  const itemJson = JSON.stringify(ser).replace(/"/g, '&quot;');
  return `
    <div class="card">
      ${ser.imagen
        ? `<img src="${ser.imagen}" class="card__imagen" alt="${ser.nombre}" onerror="this.src='../assets/placeholder.jpg'">`
        : `<div class="card__imagen" style="background:var(--color-secundario);display:flex;align-items:center;justify-content:center;font-size:3rem">⭐</div>`
      }
      <div class="card__contenido">
        <h3 class="card__titulo">${ser.nombre || 'Servicio'}</h3>
        <p class="card__precio">$${Number(ser.precio || 0).toLocaleString('es-CO')}</p>
        <p class="card__descripcion">${ser.Descripcion || ser.descripcion || 'Servicio de calidad.'}</p>
        <div class="card__acciones">
          <button class="btn btn-secundario" onclick="mostrarDetalles(${itemJson}, 'Servicio')">Detalles</button>
          <button class="btn btn-primario"   onclick="editarServicio('${ser.IDServicio}','${ser.nombre}',${ser.precio},'${ser.Descripcion || ''}','${ser.imagen || ''}')">Editar</button>
          <button class="btn btn-peligro"    onclick="eliminarServicio('${ser.IDServicio}')">Borrar</button>
        </div>
      </div>
    </div>`;
}

// ===== TEMPLATES INICIO (solo vista, sin botones admin) =====
function templateHabitacionInicio(hab) {
  const itemJson = JSON.stringify(hab).replace(/"/g, '&quot;');
  return `
    <div class="card">
      ${hab.imagen
        ? `<img src="${hab.imagen}" class="card__imagen" alt="${hab.NombreHabitacion || hab.tipo}" onerror="this.style.display='none'">`
        : `<div class="card__imagen" style="background:var(--color-acento);display:flex;align-items:center;justify-content:center;font-size:3rem">🛏️</div>`
      }
      <div class="card__contenido">
        <h3 class="card__titulo">${hab.NombreHabitacion || hab.tipo || 'Habitación'}</h3>
        <p class="card__precio">$${Number(hab.precio || 0).toLocaleString('es-CO')} / noche</p>
        <p class="card__descripcion">${hab.descripcion || 'Habitación confortable.'}</p>
        <div class="card__acciones">
          <button class="btn btn-secundario" onclick="mostrarDetalles(${itemJson}, 'Habitación')" style="width:100%">Ver Detalles</button>
        </div>
      </div>
    </div>`;
}

function templatePaqueteInicio(paq) {
  const itemJson = JSON.stringify(paq).replace(/"/g, '&quot;');
  return `
    <div class="card">
      ${paq.imagen
        ? `<img src="${paq.imagen}" class="card__imagen" alt="${paq.nombre}" onerror="this.style.display='none'">`
        : `<div class="card__imagen" style="background:var(--color-primario);display:flex;align-items:center;justify-content:center;font-size:3rem">✈️</div>`
      }
      <div class="card__contenido">
        <h3 class="card__titulo">${paq.nombre || 'Paquete'}</h3>
        <p class="card__precio">$${Number(paq.Precio || paq.precio || 0).toLocaleString('es-CO')}</p>
        <p class="card__descripcion">${paq.Descripcion || paq.descripcion || 'Paquete especial.'}</p>
        <div class="card__acciones">
          <button class="btn btn-secundario" onclick="mostrarDetalles(${itemJson}, 'Paquete')" style="width:100%">Ver Detalles</button>
        </div>
      </div>
    </div>`;
}

function templateServicioInicio(ser) {
  const itemJson = JSON.stringify(ser).replace(/"/g, '&quot;');
  return `
    <div class="card">
      ${ser.imagen
        ? `<img src="${ser.imagen}" class="card__imagen" alt="${ser.nombre}" onerror="this.style.display='none'">`
        : `<div class="card__imagen" style="background:var(--color-secundario);display:flex;align-items:center;justify-content:center;font-size:3rem">⭐</div>`
      }
      <div class="card__contenido">
        <h3 class="card__titulo">${ser.nombre || 'Servicio'}</h3>
        <p class="card__precio">$${Number(ser.precio || 0).toLocaleString('es-CO')}</p>
        <p class="card__descripcion">${ser.Descripcion || ser.descripcion || 'Servicio de calidad.'}</p>
        <div class="card__acciones">
          <button class="btn btn-secundario" onclick="mostrarDetalles(${itemJson}, 'Servicio')" style="width:100%">Ver Detalles</button>
        </div>
      </div>
    </div>`;
}

// ===== CARGAR DATOS INICIO =====
// CORRECCIÓN: Promise.allSettled en vez de Promise.all
// → si un endpoint falla, las otras secciones igual se muestran
async function iniciarInicio() {
  const [resHab, resPaq, resSer] = await Promise.allSettled([
    habitacionesAPI.getAll(),
    paquetesAPI.getAll(),
    serviciosAPI.getAll()
  ]);

  const contHab = document.getElementById('habitaciones-container');
  if (contHab) {
    const habitaciones = resHab.status === 'fulfilled' ? resHab.value : [];
    contHab.innerHTML = habitaciones.length
      ? habitaciones.slice(0, 6).map(templateHabitacionInicio).join('')
      : '<p class="loading">No hay habitaciones disponibles.</p>';
  }

  const contPaq = document.getElementById('paquetes-container');
  if (contPaq) {
    const paquetes = resPaq.status === 'fulfilled' ? resPaq.value : [];
    contPaq.innerHTML = paquetes.length
      ? paquetes.slice(0, 6).map(templatePaqueteInicio).join('')
      : '<p class="loading">No hay paquetes disponibles.</p>';
  }

  const contSer = document.getElementById('servicios-container');
  if (contSer) {
    const servicios = resSer.status === 'fulfilled' ? resSer.value : [];
    contSer.innerHTML = servicios.length
      ? servicios.slice(0, 6).map(templateServicioInicio).join('')
      : '<p class="loading">No hay servicios disponibles.</p>';
  }
}

// ===== MODAL DE DETALLES =====
// CORRECCIÓN: usa clase CSS 'activo' en vez de mezclar style.display con flex
window.mostrarDetalles = (item, tipo) => {
  const modal = document.getElementById('detalle-modal-overlay');
  if (!modal) return;

  document.getElementById('detalle-nombre').textContent =
    item.nombre || item.NombreHabitacion || item.tipo || 'Sin nombre';
  document.getElementById('detalle-descripcion').textContent =
    item.descripcion || item.Descripcion || 'Sin descripción disponible.';
  document.getElementById('detalle-precio').textContent =
    `$${Number(item.precio || item.Precio || 0).toLocaleString('es-CO')}`;
  document.getElementById('detalle-categoria').textContent = tipo;

  document.getElementById('detalle-img').src =
    item.imagen || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000';

  const extraDiv = document.getElementById('detalle-extra');
  if (extraDiv) {
    extraDiv.innerHTML = (tipo === 'Habitación' && item.capacidad)
      ? `<span style="display:block;color:#6b7280;font-size:.7rem;font-weight:bold;text-transform:uppercase">Capacidad</span>
         <span style="color:#111827;font-size:1.4rem;font-weight:800">${item.capacidad} Pers.</span>`
      : '';
  }

  modal.classList.add('activo');
};

document.addEventListener('click', (e) => {
  if (e.target.id === 'btn-cerrar-detalle' || e.target.id === 'btn-entendido') {
    document.getElementById('detalle-modal-overlay')?.classList.remove('activo');
  }
});

// ===== UTILIDADES =====
function mostrarMensaje(texto, tipo) {
  const mensaje = document.getElementById('mensaje');
  if (!mensaje) return;
  mensaje.textContent = texto;
  mensaje.className = `mensaje activo mensaje-${tipo}`;
  setTimeout(() => { mensaje.className = 'mensaje'; }, 3000);
}

function abrirModal(titulo) {
  document.getElementById('modal-titulo').textContent = titulo;
  document.getElementById('modal-overlay').classList.add('activo');
}

function cerrarModal() {
  document.getElementById('modal-overlay').classList.remove('activo');
}

// ===== VALIDACIÓN =====
function mostrarError(campoId, errorId, mensaje) {
  const campo = document.getElementById(campoId);
  const error = document.getElementById(errorId);
  if (!campo || !error) return;
  campo.classList.add('input-error');
  campo.classList.remove('input-ok');
  error.textContent = mensaje;
  error.classList.add('visible');
}

function limpiarError(campoId, errorId) {
  const campo = document.getElementById(campoId);
  const error = document.getElementById(errorId);
  if (!campo || !error) return;
  campo.classList.remove('input-error');
  campo.classList.add('input-ok');
  error.classList.remove('visible');
}

function limpiarTodosLosErrores(campos) {
  campos.forEach(({ campoId, errorId }) => {
    document.getElementById(campoId)?.classList.remove('input-error', 'input-ok');
    document.getElementById(errorId)?.classList.remove('visible');
  });
}

function validarHabitacion() {
  let valido = true;
  const nombre     = document.getElementById('habitacion-nombre').value.trim();
  const precio     = document.getElementById('habitacion-precio').value;
  const descripcion = document.getElementById('habitacion-descripcion').value.trim();

  if (!nombre) { mostrarError('habitacion-nombre', 'error-habitacion-nombre', 'El nombre es obligatorio.'); valido = false; }
  else limpiarError('habitacion-nombre', 'error-habitacion-nombre');

  if (!precio || Number(precio) <= 0) { mostrarError('habitacion-precio', 'error-habitacion-precio', 'Ingresa un precio válido mayor a 0.'); valido = false; }
  else limpiarError('habitacion-precio', 'error-habitacion-precio');

  if (!descripcion) { mostrarError('habitacion-descripcion', 'error-habitacion-descripcion', 'La descripción es obligatoria.'); valido = false; }
  else limpiarError('habitacion-descripcion', 'error-habitacion-descripcion');

  return valido;
}

function validarPaquete() {
  let valido = true;
  const nombre      = document.getElementById('paquete-nombre').value.trim();
  const precio      = document.getElementById('paquete-precio').value;
  const descripcion = document.getElementById('paquete-descripcion').value.trim();

  if (!nombre) { mostrarError('paquete-nombre', 'error-paquete-nombre', 'El nombre es obligatorio.'); valido = false; }
  else limpiarError('paquete-nombre', 'error-paquete-nombre');

  if (!precio || Number(precio) <= 0) { mostrarError('paquete-precio', 'error-paquete-precio', 'Ingresa un precio válido mayor a 0.'); valido = false; }
  else limpiarError('paquete-precio', 'error-paquete-precio');

  if (!descripcion) { mostrarError('paquete-descripcion', 'error-paquete-descripcion', 'La descripción es obligatoria.'); valido = false; }
  else limpiarError('paquete-descripcion', 'error-paquete-descripcion');

  return valido;
}

function validarServicio() {
  let valido = true;
  const nombre      = document.getElementById('servicio-nombre').value.trim();
  const precio      = document.getElementById('servicio-precio').value;
  const descripcion = document.getElementById('servicio-descripcion').value.trim();

  if (!nombre) { mostrarError('servicio-nombre', 'error-servicio-nombre', 'El nombre es obligatorio.'); valido = false; }
  else limpiarError('servicio-nombre', 'error-servicio-nombre');

  if (!precio || Number(precio) <= 0) { mostrarError('servicio-precio', 'error-servicio-precio', 'Ingresa un precio válido mayor a 0.'); valido = false; }
  else limpiarError('servicio-precio', 'error-servicio-precio');

  if (!descripcion) { mostrarError('servicio-descripcion', 'error-servicio-descripcion', 'La descripción es obligatoria.'); valido = false; }
  else limpiarError('servicio-descripcion', 'error-servicio-descripcion');

  return valido;
}

// ===== HABITACIONES CRUD =====
function configurarEventosHabitaciones() {
  const camposHab = [
    { campoId: 'habitacion-nombre',      errorId: 'error-habitacion-nombre' },
    { campoId: 'habitacion-precio',      errorId: 'error-habitacion-precio' },
    { campoId: 'habitacion-descripcion', errorId: 'error-habitacion-descripcion' },
  ];

  document.getElementById('btn-agregar')?.addEventListener('click', () => {
    document.getElementById('form-habitacion').reset();
    document.getElementById('habitacion-id').value = '';
    limpiarTodosLosErrores(camposHab);
    abrirModal('Nueva Habitación');
  });

  document.getElementById('form-habitacion')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarHabitacion()) return;

    const id          = document.getElementById('habitacion-id').value;
    const nombreInput = document.getElementById('habitacion-nombre').value.trim();

    if (!id) {
      const existe = datosOriginales.some(h =>
        (h.NombreHabitacion || h.tipo || '').toLowerCase() === nombreInput.toLowerCase()
      );
      if (existe) { mostrarError('habitacion-nombre', 'error-habitacion-nombre', 'Ya existe una habitación con ese nombre.'); return; }
    }

    const data = {
      tipo: nombreInput,
      precio: document.getElementById('habitacion-precio').value,
      descripcion: document.getElementById('habitacion-descripcion').value.trim(),
      imagen: document.getElementById('habitacion-imagen').value || '',
      Estado: 1
    };

    try {
      if (id) await habitacionesAPI.update(id, data);
      else await habitacionesAPI.create(data);
      cerrarModal();
      mostrarMensaje('Operación exitosa', 'exito');
      cargarDatos(habitacionesAPI);
    } catch { mostrarMensaje('Error al guardar', 'error'); }
  });

  document.getElementById('buscador-input')?.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    datosFiltrados = datosOriginales.filter(h =>
      (h.NombreHabitacion || h.tipo || '').toLowerCase().includes(texto) ||
      (h.descripcion || '').toLowerCase().includes(texto)
    );
    paginaActual = 1;
    renderizarPagina();
  });
}

window.editarHabitacion = (id, nombre, precio, descripcion, imagen) => {
  document.getElementById('habitacion-id').value        = id;
  document.getElementById('habitacion-nombre').value    = nombre;
  document.getElementById('habitacion-precio').value    = precio;
  document.getElementById('habitacion-descripcion').value = descripcion;
  document.getElementById('habitacion-imagen').value    = imagen;
  limpiarTodosLosErrores([
    { campoId: 'habitacion-nombre',      errorId: 'error-habitacion-nombre' },
    { campoId: 'habitacion-precio',      errorId: 'error-habitacion-precio' },
    { campoId: 'habitacion-descripcion', errorId: 'error-habitacion-descripcion' },
  ]);
  abrirModal('Editar Habitación');
};

window.eliminarHabitacion = async (id) => {
  if (confirm('¿Eliminar esta habitación?')) {
    await habitacionesAPI.delete(id);
    cargarDatos(habitacionesAPI);
  }
};

// ===== PAQUETES CRUD =====
function configurarEventosPaquetes() {
  const camposPaq = [
    { campoId: 'paquete-nombre',      errorId: 'error-paquete-nombre' },
    { campoId: 'paquete-precio',      errorId: 'error-paquete-precio' },
    { campoId: 'paquete-descripcion', errorId: 'error-paquete-descripcion' },
  ];

  document.getElementById('btn-agregar')?.addEventListener('click', () => {
    document.getElementById('form-paquete').reset();
    document.getElementById('paquete-id').value = '';
    limpiarTodosLosErrores(camposPaq);
    abrirModal('Nuevo Paquete');
  });

  document.getElementById('form-paquete')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarPaquete()) return;

    const id          = document.getElementById('paquete-id').value;
    const nombreInput = document.getElementById('paquete-nombre').value.trim();

    if (!id) {
      const existe = datosOriginales.some(p => p.nombre.toLowerCase() === nombreInput.toLowerCase());
      if (existe) { mostrarError('paquete-nombre', 'error-paquete-nombre', 'Ya existe un paquete con ese nombre.'); return; }
    }

    const data = {
      nombre: nombreInput,
      Precio: document.getElementById('paquete-precio').value,
      Descripcion: document.getElementById('paquete-descripcion').value.trim(),
      imagen: document.getElementById('paquete-imagen').value || '',
      Estado: 'activo'
    };

    try {
      if (id) await paquetesAPI.update(id, data);
      else await paquetesAPI.create(data);
      cerrarModal();
      mostrarMensaje('Operación exitosa', 'exito');
      cargarDatos(paquetesAPI);
    } catch { mostrarMensaje('Error al guardar', 'error'); }
  });

  document.getElementById('buscador-input')?.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    datosFiltrados = datosOriginales.filter(p => p.nombre.toLowerCase().includes(texto));
    paginaActual = 1;
    renderizarPagina();
  });
}

window.editarPaquete = (id, nombre, precio, descripcion, imagen) => {
  document.getElementById('paquete-id').value           = id;
  document.getElementById('paquete-nombre').value       = nombre;
  document.getElementById('paquete-precio').value       = precio;
  document.getElementById('paquete-descripcion').value  = descripcion;
  document.getElementById('paquete-imagen').value       = imagen;
  limpiarTodosLosErrores([
    { campoId: 'paquete-nombre',      errorId: 'error-paquete-nombre' },
    { campoId: 'paquete-precio',      errorId: 'error-paquete-precio' },
    { campoId: 'paquete-descripcion', errorId: 'error-paquete-descripcion' },
  ]);
  abrirModal('Editar Paquete');
};

window.eliminarPaquete = async (id) => {
  if (confirm('¿Eliminar este paquete?')) {
    await paquetesAPI.delete(id);
    cargarDatos(paquetesAPI);
  }
};

// ===== SERVICIOS CRUD =====
function configurarEventosServicios() {
  const camposSer = [
    { campoId: 'servicio-nombre',      errorId: 'error-servicio-nombre' },
    { campoId: 'servicio-precio',      errorId: 'error-servicio-precio' },
    { campoId: 'servicio-descripcion', errorId: 'error-servicio-descripcion' },
  ];

  document.getElementById('btn-agregar')?.addEventListener('click', () => {
    document.getElementById('form-servicio').reset();
    document.getElementById('servicio-id').value = '';
    limpiarTodosLosErrores(camposSer);
    abrirModal('Nuevo Servicio');
  });

  document.getElementById('form-servicio')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validarServicio()) return;

    const id          = document.getElementById('servicio-id').value;
    const nombreInput = document.getElementById('servicio-nombre').value.trim();

    if (!id) {
      const existe = datosOriginales.some(s => s.nombre.toLowerCase() === nombreInput.toLowerCase());
      if (existe) { mostrarError('servicio-nombre', 'error-servicio-nombre', 'Ya existe un servicio con ese nombre.'); return; }
    }

    const data = {
      nombre: nombreInput,
      precio: document.getElementById('servicio-precio').value,
      Descripcion: document.getElementById('servicio-descripcion').value.trim(),
      imagen: document.getElementById('servicio-imagen').value || '',
      Estado: 'activo'
    };

    try {
      if (id) await serviciosAPI.update(id, data);
      else await serviciosAPI.create(data);
      cerrarModal();
      mostrarMensaje('Operación exitosa', 'exito');
      cargarDatos(serviciosAPI);
    } catch { mostrarMensaje('Error al guardar', 'error'); }
  });

  document.getElementById('buscador-input')?.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    datosFiltrados = datosOriginales.filter(s => s.nombre.toLowerCase().includes(texto));
    paginaActual = 1;
    renderizarPagina();
  });
}

window.editarServicio = (id, nombre, precio, descripcion, imagen) => {
  document.getElementById('servicio-id').value           = id;
  document.getElementById('servicio-nombre').value       = nombre;
  document.getElementById('servicio-precio').value       = precio;
  document.getElementById('servicio-descripcion').value  = descripcion;
  document.getElementById('servicio-imagen').value       = imagen;
  limpiarTodosLosErrores([
    { campoId: 'servicio-nombre',      errorId: 'error-servicio-nombre' },
    { campoId: 'servicio-precio',      errorId: 'error-servicio-precio' },
    { campoId: 'servicio-descripcion', errorId: 'error-servicio-descripcion' },
  ]);
  abrirModal('Editar Servicio');
};

window.eliminarServicio = async (id) => {
  if (confirm('¿Eliminar este servicio?')) {
    await serviciosAPI.delete(id);
    cargarDatos(serviciosAPI);
  }
};

// ===== CARGAR DATOS (páginas internas) =====
async function cargarDatos(api) {
  try {
    datosOriginales = await api.getAll();
    datosFiltrados  = [...datosOriginales];
    paginaActual    = 1;
    renderizarPagina();
  } catch (error) {
    console.error('Error cargando datos:', error);
  }
}

// ===== INICIAR PÁGINA =====
async function iniciarPagina() {
  const path = window.location.pathname;

  if (path.includes('habitaciones')) {
    tipoModuloActual = 'habitaciones';
    configurarEventosHabitaciones();
    await cargarDatos(habitacionesAPI);
  } else if (path.includes('paquetes')) {
    tipoModuloActual = 'paquetes';
    configurarEventosPaquetes();
    await cargarDatos(paquetesAPI);
  } else if (path.includes('servicios')) {
    tipoModuloActual = 'servicios';
    configurarEventosServicios();
    await cargarDatos(serviciosAPI);
  } else {
    await iniciarInicio();
  }
}

document.getElementById('btn-cancelar')?.addEventListener('click', cerrarModal);

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', async () => {
  await cargarComponentes();
  await iniciarPagina();
});