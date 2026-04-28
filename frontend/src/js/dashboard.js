/* ===== DASHBOARD.JS ===== */
/* Lógica del panel de control de Aura Travel */
/* Depende de: api.js (ya cargado antes en el HTML) */

// ── Mostrar fecha actual ──────────────────────────────────────────────────────
function mostrarFecha() {
  const el = document.getElementById('dashboard-fecha');
  if (!el) return;
  const ahora = new Date();
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  el.textContent = ahora.toLocaleDateString('es-CO', opciones);
}

// ── Animación de número ───────────────────────────────────────────────────────
function animarNumero(el, destino, duracion = 600) {
  const inicio = 0;
  const pasos = 30;
  const intervalo = duracion / pasos;
  let paso = 0;
  el.classList.remove('loading-num');
  const timer = setInterval(() => {
    paso++;
    const valor = Math.round(inicio + (destino - inicio) * (paso / pasos));
    el.textContent = valor;
    if (paso >= pasos) {
      clearInterval(timer);
      el.textContent = destino;
    }
  }, intervalo);
}

// ── Renderizar tabla mini de cabañas ─────────────────────────────────────────
function renderTablaCabanasRecientes(cabanas) {
  const contenedor = document.getElementById('tabla-cabanas-recientes');
  if (!contenedor) return;

  if (!cabanas || cabanas.length === 0) {
    contenedor.innerHTML = '<p class="dashboard-loading">No hay cabañas registradas.</p>';
    return;
  }

  const ultimas = cabanas.slice(0, 5);

  function etiquetaEstadoCabana(estado) {
    switch (Number(estado)) {
      case 1: return { texto: 'Mantenimiento', clase: 'badge--mantenimiento' };
      case 2: return { texto: 'Reservada',     clase: 'badge--reservada' };
      case 3: return { texto: 'En limpieza',   clase: 'badge--limpieza' };
      case 4: return { texto: 'Inactiva',      clase: 'badge--inactivo' };
      case 5: return { texto: 'Disponible',    clase: 'badge--activo' };
      default: return { texto: 'Desconocido',  clase: 'badge--inactivo' };
    }
  }

  contenedor.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Cabaña</th>
          <th>Capacidad</th>
          <th>Precio/noche</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${ultimas.map(c => {
          const { texto, clase } = etiquetaEstadoCabana(c.Estado);
          return `
            <tr>
              <td>${c.NombreCabana || '—'}</td>
              <td>${c.CapacidadPersonas || '—'} pers.</td>
              <td>$${Number(c.PrecioNoche || 0).toLocaleString('es-CO')}</td>
              <td>
                <span class="badge ${clase}">
                  ${texto}
                </span>
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ── Renderizar tabla mini de clientes ────────────────────────────────────────
function renderTablaClientesRecientes(clientes) {
  const contenedor = document.getElementById('tabla-clientes-recientes');
  if (!contenedor) return;

  if (!clientes || clientes.length === 0) {
    contenedor.innerHTML = '<p class="dashboard-loading">No hay clientes registrados.</p>';
    return;
  }

  const ultimos = clientes.slice(0, 5);
  contenedor.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Documento</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${ultimos.map(cl => {
          const activo = cl.Estado === 1 || cl.Estado === '1' || cl.Estado === true;
          return `
            <tr>
              <td>${cl.Nombre || ''} ${cl.Apellido || ''}</td>
              <td>${cl.NroDocumento || '—'}</td>
              <td>
                <span class="badge ${activo ? 'badge--activo' : 'badge--inactivo'}">
                  ${activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// ── Referencias a instancias de gráficas ─────────────────────────────────────
let chartCabanas  = null;
let chartClientes = null;
let chartReservas = null;

// ── Gráfica 1: Estado de cabañas (Dona) ──────────────────────────────────────
function renderGraficaCabanas(cabanas) {
  const canvas = document.getElementById('grafica-cabanas');
  if (!canvas) return;

  const enMantenimiento = cabanas.filter(c => Number(c.Estado) === 1).length;
  const enReserva       = cabanas.filter(c => Number(c.Estado) === 2).length;
  const enLimpieza      = cabanas.filter(c => Number(c.Estado) === 3).length;
  const enInactivo      = cabanas.filter(c => Number(c.Estado) === 4).length;
  const enDisponible    = cabanas.filter(c => Number(c.Estado) === 5).length;

  if (chartCabanas) chartCabanas.destroy();

  chartCabanas = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Mantenimiento', 'Reservadas', 'En limpieza', 'Inactivas', 'Disponibles'],
      datasets: [{
        data: [enMantenimiento, enReserva, enLimpieza, enInactivo, enDisponible],
        backgroundColor: ['#7b2ff7', '#00b4d8', '#38bdf8', '#ef4444', '#10b981'],
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 14,
            font: { size: 12, family: "'Inter', sans-serif" },
            color: '#4b5563',
            usePointStyle: true,
            pointStyleWidth: 10
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} cabaña${ctx.parsed !== 1 ? 's' : ''}`
          }
        }
      }
    }
  });
}

// ── Gráfica 2: Clientes activos vs inactivos (Barras) ────────────────────────
function renderGraficaClientes(clientes) {
  const canvas = document.getElementById('grafica-clientes');
  if (!canvas) return;

  const activos   = clientes.filter(c => c.Estado === 1 || c.Estado === '1' || c.Estado === true).length;
  const inactivos = clientes.length - activos;

  if (chartClientes) chartClientes.destroy();

  chartClientes = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Activos', 'Inactivos'],
      datasets: [{
        label: 'Clientes',
        data: [activos, inactivos],
        backgroundColor: ['rgba(0, 180, 216, 0.85)', 'rgba(239, 68, 68, 0.75)'],
        borderColor: ['#00b4d8', '#ef4444'],
        borderWidth: 2,
        borderRadius: 10,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} cliente${ctx.parsed.y !== 1 ? 's' : ''}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#4b5563', font: { size: 13, weight: '600' } }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#9ca3af', stepSize: 1, precision: 0 },
          grid: { color: 'rgba(0,0,0,0.05)' }
        }
      }
    }
  });
}

// ── Gráfica 3: Reservas por estado (Barras horizontales) ─────────────────────
function renderGraficaReservas(reservas) {
  const canvas = document.getElementById('grafica-reservas');
  if (!canvas) return;

  if (!reservas || reservas.length === 0) {
    const contenedor = canvas.parentElement;
    contenedor.innerHTML = '<p class="dashboard-loading">No hay reservas registradas.</p>';
    return;
  }

  // Agrupa por el campo Estado (compatible con texto o número)
  const conteo = {};
  reservas.forEach(r => {
    const estado = String(r.Estado ?? r.estado ?? r.EstadoReserva ?? 'Sin estado');
    conteo[estado] = (conteo[estado] || 0) + 1;
  });

  const etiquetas = Object.keys(conteo);
  const valores   = Object.values(conteo);

  const colores = [
    'rgba(123, 47, 247, 0.85)',
    'rgba(0, 212, 255, 0.85)',
    'rgba(16, 185, 129, 0.85)',
    'rgba(224, 64, 251, 0.85)',
    'rgba(239, 68, 68, 0.80)',
    'rgba(251, 191, 36, 0.85)'
  ];

  if (chartReservas) chartReservas.destroy();

  chartReservas = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'Reservas',
        data: valores,
        backgroundColor: etiquetas.map((_, i) => colores[i % colores.length]),
        borderColor: etiquetas.map((_, i) => colores[i % colores.length].replace(/0\.\d+\)/, '1)')),
        borderWidth: 2,
        borderRadius: 10,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.x} reserva${ctx.parsed.x !== 1 ? 's' : ''}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: '#9ca3af', precision: 0, stepSize: 1 },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#4b5563', font: { size: 12, weight: '600' } }
        }
      }
    }
  });
}

// ── Cargar todos los datos del dashboard ─────────────────────────────────────
async function cargarDashboard() {
  mostrarFecha();

  ['stat-cabanas', 'stat-habitaciones', 'stat-clientes', 'stat-paquetes', 'stat-servicios']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = '…'; el.classList.add('loading-num'); }
    });

  try {
    const [cabanas, habitaciones, clientes, paquetes, servicios, reservas] = await Promise.all([
      cabanasAPI.getAll().catch(() => []),
      habitacionesAPI.getAll().catch(() => []),
      clientesAPI.getAll().catch(() => []),
      paquetesAPI.getAll().catch(() => []),
      serviciosAPI.getAll().catch(() => []),
      reservasAPI.getAll().catch(() => [])
    ]);

    // ── Cabañas ──
    const elCabanas = document.getElementById('stat-cabanas');
    if (elCabanas) animarNumero(elCabanas, cabanas.length);
    const cabanasActivas = cabanas.filter(c => c.Estado === 1 || c.Estado === '1' || c.Estado === true).length;
    const subCab = document.getElementById('stat-cabanas-activas');
    if (subCab) subCab.textContent = `${cabanasActivas} disponibles`;

    // ── Habitaciones ──
    const elHab = document.getElementById('stat-habitaciones');
    if (elHab) animarNumero(elHab, habitaciones.length);
    const subHab = document.getElementById('stat-habitaciones-sub');
    if (subHab) subHab.textContent = habitaciones.length === 1 ? '1 registrada' : `${habitaciones.length} registradas`;

    // ── Clientes ──
    const elCli = document.getElementById('stat-clientes');
    if (elCli) animarNumero(elCli, clientes.length);
    const clientesActivos = clientes.filter(c => c.Estado === 1 || c.Estado === '1' || c.Estado === true).length;
    const subCli = document.getElementById('stat-clientes-activos');
    if (subCli) subCli.textContent = `${clientesActivos} activos`;

    // ── Paquetes ──
    const elPaq = document.getElementById('stat-paquetes');
    if (elPaq) animarNumero(elPaq, paquetes.length);
    const subPaq = document.getElementById('stat-paquetes-sub');
    if (subPaq) subPaq.textContent = paquetes.length === 1 ? '1 disponible' : `${paquetes.length} disponibles`;

    // ── Servicios ──
    const elSer = document.getElementById('stat-servicios');
    if (elSer) animarNumero(elSer, servicios.length);
    const subSer = document.getElementById('stat-servicios-sub');
    if (subSer) subSer.textContent = servicios.length === 1 ? '1 disponible' : `${servicios.length} disponibles`;

    // ── Tablas recientes ──
    renderTablaCabanasRecientes(cabanas);
    renderTablaClientesRecientes(clientes);

    // ── Gráficas ──
    renderGraficaCabanas(cabanas);
    renderGraficaClientes(clientes);
    renderGraficaReservas(reservas);

  } catch (err) {
    console.error('Error cargando el dashboard:', err);
    const errEl = document.getElementById('dashboard-error');
    if (errEl) errEl.style.display = 'block';

    ['stat-cabanas', 'stat-habitaciones', 'stat-clientes', 'stat-paquetes', 'stat-servicios']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = '0'; el.classList.remove('loading-num'); }
      });

    ['tabla-cabanas-recientes', 'tabla-clientes-recientes'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="dashboard-loading">No se pudo cargar la información.</p>';
    });
  }
}

// ── Inicializar cuando el DOM esté listo ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  cargarDashboard();
});