// Verificar sesión
const userData = localStorage.getItem('user');
if (!userData) window.location.href = '/src/pages/login.html';
const user = JSON.parse(userData || '{}');
if (!user.IDUsuario) {
  localStorage.removeItem('user');
  window.location.href = '/src/pages/login.html';
}

// El nombre del usuario se inyecta en app.js → cargarComponentes() al insertar el header

let habitacionesData = [];
let cabanasData = [];
let paquetesData = [];
let serviciosData = [];

let allReservationsGlobal = [];
let fpEditStart = null;
let fpEditEnd = null;
let esReservaEnProceso = false;
let serviciosExistentesIds = new Set();

async function cargarTodasReservas() {
    try {
        const response = await fetch('/api/reservas');
        if (response.ok) {
            allReservationsGlobal = await response.json();
        }
    } catch(e) {}
}

function formatDateForInput(value) {
    if (!value) return '';
    return value.split('T')[0];
}

function getEditSelectedRoomId() {
    const alojSelect = document.getElementById('editAlojamiento');
    if (!alojSelect || !alojSelect.value) return null;
    const tipo = document.getElementById('editTipoAloj')?.value || 'habitacion';
    if (tipo === 'paquete') {
        const paq = paquetesData.find(p => String(p.IDPaquete) === String(alojSelect.value));
        return paq ? paq.IDHabitacion : alojSelect.value;
    }
    return alojSelect.value;
}

function getRoomBlockedRanges(roomId, excludeResId) {
    if (!roomId) return [];
    return allReservationsGlobal
        .filter(r => String(r.IDHabitacion) === String(roomId) && String(r.IdReserva) !== String(excludeResId) && r.FechaInicio && r.FechaFinalizacion && r.NombreEstadoReserva !== 'Cancelada')
        .map(r => ({ start: formatDateForInput(r.FechaInicio), end: formatDateForInput(r.FechaFinalizacion) }));
}

function getDisabledDatesForRoom(roomId, excludeResId) {
    if (!roomId) return [];
    const blockedRanges = getRoomBlockedRanges(roomId, excludeResId);
    const disabledDates = [];
    blockedRanges.forEach(range => {
        const startDate = new Date(range.start);
        startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
        const endDate = new Date(range.end);
        endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            disabledDates.push(formatDateForInput(currentDate.toISOString()));
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });
    return disabledDates;
}

function updateEditDatePickerRestrictions() {
    // No se usa flatpickr en el modal de edición del cliente (usa <input type="date"> nativo)
}

function isRangeOverlapping(start, end, range) {
    return !(end < range.start || start > range.end);
}

function validateEditDateSelection() {
    const roomId = getEditSelectedRoomId();
    const currentResId = document.getElementById('editIdReserva').value;
    const startInput = document.getElementById('editFechaInicio');
    const endInput = document.getElementById('editFechaFinalizacion');
    const startValue = startInput.value;
    const endValue = endInput.value;
    const blockedRanges = getRoomBlockedRanges(roomId, currentResId);
    
    let startError = '';
    let endError = '';
    
    if (startValue && endValue && endValue <= startValue) endError = 'La fecha de finalización debe ser al menos el día siguiente al de inicio.';
    if (roomId && startValue && blockedRanges.some(r => isRangeOverlapping(startValue, startValue, r))) startError = 'La fecha de inicio está ocupada.';
    if (roomId && endValue && blockedRanges.some(r => isRangeOverlapping(endValue, endValue, r))) endError = 'La fecha de finalización está ocupada.';
    if (roomId && startValue && endValue && blockedRanges.some(r => isRangeOverlapping(startValue, endValue, r))) {
        startError = 'El rango de fechas se solapa con una reserva existente.';
        endError = 'El rango de fechas se solapa con una reserva existente.';
    }
    
    startInput.setCustomValidity(startError);
    endInput.setCustomValidity(endError);
    startInput.reportValidity();
    endInput.reportValidity();
    return !startInput.validationMessage && !endInput.validationMessage;
}
async function cargarHabitaciones() {
    const response = await fetch('/api/habitaciones');
    habitacionesData = await response.json();
}

async function cargarCabanas() {
    const response = await fetch('/api/cabanas');
    cabanasData = await response.json();
}

async function cargarPaquetes() {
    const response = await fetch('/api/paquetes');
    paquetesData = await response.json();
}

function populatePaqueteAdicional(selectedId) {
    const sel = document.getElementById('editPaqueteAdicional');
    if (!sel) return;
    const activos = paquetesData.filter(p => (p.Estado ?? 1) !== 0);
    sel.innerHTML = '<option value="">Sin paquete adicional</option>' +
        activos.map(p => {
            const precio = Number(p.Precio || p.precio || 0);
            const sel2 = selectedId && String(p.IDPaquete) === String(selectedId) ? ' selected' : '';
            return `<option value="${p.IDPaquete}" data-precio="${precio}"${sel2}>${p.NombrePaquete || p.nombre} — $${precio.toLocaleString('es-CO')}/noche</option>`;
        }).join('');
}

function renderOpcionesEdicion(tipo, selId) {
    const cfg = {
        habitacion: { list: habitacionesData, id: 'IDHabitacion', name: 'NombreHabitacion', price: h => Number(h.Costo || h.precio || h.Precio || 0) },
        cabana:     { list: cabanasData,      id: 'IDCabana',     name: 'NombreCabana',     price: c => Number(c.PrecioNoche || c.precio || 0) },
        paquete:    { list: paquetesData,     id: 'IDPaquete',    name: 'NombrePaquete',     price: p => Number(p.Precio || p.precio || 0) },
    }[tipo];
    if (!cfg) return '<option value="">Seleccione una opción</option>';
    const activos = cfg.list.filter(i => (i.Estado ?? 1) !== 0);
    return '<option value="">Seleccione una opción</option>' +
        activos.map(item => {
            const precio = cfg.price(item);
            const sel = selId && String(item[cfg.id]) === String(selId) ? ' selected' : '';
            return `<option value="${item[cfg.id]}" data-precio="${precio}"${sel}>${item[cfg.name]} — $${precio.toLocaleString('es-CO')}/noche</option>`;
        }).join('');
}

function updateTabStyles(tipoActivo) {
    const tabs = [
        { id: 'editTabHab', tipo: 'habitacion' },
        { id: 'editTabCab', tipo: 'cabana' },
        { id: 'editTabPaq', tipo: 'paquete' },
    ];
    tabs.forEach(({ id, tipo }) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const active = tipo === tipoActivo;
        btn.style.background  = active ? '#2B6CB0' : '#fff';
        btn.style.color       = active ? '#fff'    : '#2B6CB0';
        btn.style.borderColor = active ? '#2B6CB0' : 'rgba(43,108,176,0.3)';
    });
}

window.clientSwitchTipo = function(tipo) {
    document.getElementById('editTipoAloj').value = tipo;
    document.getElementById('editAlojamiento').innerHTML = renderOpcionesEdicion(tipo, null);
    const labels = { habitacion: 'Selecciona una habitación', cabana: 'Selecciona una cabaña', paquete: 'Selecciona un paquete' };
    document.getElementById('editAlojLabel').textContent = labels[tipo];
    updateTabStyles(tipo);
    // Mostrar/ocultar paquete adicional según el tipo seleccionado
    const paqWrap = document.getElementById('editPaqueteAdicionalWrap');
    if (paqWrap) {
        paqWrap.style.display = tipo === 'paquete' ? 'none' : '';
        if (tipo === 'paquete') {
            const paqSel = document.getElementById('editPaqueteAdicional');
            if (paqSel) paqSel.value = '';
        }
    }
    calcularTotalEdicion();
};

async function cargarServicios() {
    try {
        const response = await fetch('/api/servicios');
        serviciosData = await response.json();
    } catch(e) {
        console.error('Error cargando servicios:', e);
        serviciosData = [];
    }
}

async function cargarMetodosPagoModal() {
    const response = await fetch('/api/metodopago');
    const metodos = await response.json();
    const select = document.getElementById('editMetodoPago');
    select.innerHTML = '<option value="">Seleccione método de pago</option>';
    const metodosPermitidos = metodos.filter(m => {
        const nombre = (m.NomMetodoPago || '').toLowerCase();
        return nombre.includes('efectivo') || nombre.includes('transferencia');
    });
    metodosPermitidos.forEach(m => {
        const option = document.createElement('option');
        option.value = m.IdMetodoPago;
        option.textContent = m.NomMetodoPago;
        select.appendChild(option);
    });
}

function formatCurrency(value) {
    return `$${Number(value).toLocaleString('es-CO')}`;
}

async function loadReservations() {
    try {
        const response = await fetch(`/api/reservas/user/${user.IDUsuario}`);
        const list = document.getElementById('reservationsList');
        if (!response.ok) {
            list.innerHTML = '<p style="color:var(--gris)">No se pudo cargar las reservas.</p>';
            return;
        }

        const reservations = await response.json();
        if (reservations.length === 0) {
            list.innerHTML = '<p style="color:var(--gris)">No tienes reservas aún. ¡Crea tu primera reserva!</p>';
            return;
        }

        // Estados terminales — sin más modificaciones posibles: 3=Cancelada, 4=Completada
        const estadosTerminales = [3, 4];

        list.innerHTML = reservations.map(r => {
            const idEstado = r.IdEstadoReserva || r.Estado;
            const esModificable = !estadosTerminales.includes(idEstado);
            const estadoClass = (r.NombreEstadoReserva || '').toLowerCase().replace(/\s+/g, '-');

            return `
            <div class="reservation-card">
                <div class="reservation-info">
                    <h3>Reserva #${r.IdReserva}
                      <span class="status-badge status-${estadoClass}" style="font-size:0.7rem;margin-left:0.5rem;vertical-align:middle;">
                        ${r.NombreEstadoReserva || ''}
                      </span>
                    </h3>
                    <p><strong>Habitación:</strong> ${r.NombreHabitacion || 'Sin asignar'}</p>
                    <p><strong>Paquete:</strong> ${r.NombrePaquete || 'Sin paquete'}</p>
                    <p><strong>Fechas:</strong> ${r.FechaInicio ? new Date(r.FechaInicio).toLocaleDateString('es-CO', { timeZone: 'UTC', day:'2-digit', month:'short', year:'numeric' }) : '-'} – ${r.FechaFinalizacion ? new Date(r.FechaFinalizacion).toLocaleDateString('es-CO', { timeZone: 'UTC', day:'2-digit', month:'short', year:'numeric' }) : '-'}</p>
                    <p><strong>Total:</strong> ${formatCurrency(r.MontoTotal || 0)}</p>
                    ${Number(r.MontoAdicional || 0) > 0 ? `
                    <div style="margin-top:0.5rem;padding:0.45rem 0.7rem;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.45);border-radius:8px;font-size:0.78rem;color:#92620a;display:flex;align-items:center;gap:0.4rem;">
                        <span>⚠️</span>
                        <span><strong>Servicios adicionales pendientes de pago:</strong> ${formatCurrency(r.MontoAdicional)} — Debes cancelarlos antes del check-out.</span>
                    </div>` : ''}
                </div>
                <div class="reservation-actions">
                    <button class="btn btn-outline-primario" onclick="loadReservationDetails(${r.IdReserva})">Ver detalles</button>
                    ${
                      esModificable
                        ? `<button class="btn btn-outline-azul" onclick="abrirEdicion(${r.IdReserva})">Editar</button>`
                        : ''
                    }
                    ${
                      esModificable
                        ? `<button class="btn btn-outline-peligro" onclick="solicitarCancelacion(${r.IdReserva}, ${r.MontoTotal || 0})">Cancelar</button>`
                        : `<button class="btn btn-outline-peligro" disabled style="opacity:0.35;cursor:not-allowed;">${idEstado === 4 ? 'Completada' : 'Cancelada'}</button>`
                    }
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Error cargando reservas', error);
    }
}

async function loadReservationDetails(id) {
    try {
        const response = await fetch(`/api/reservas/${id}`);
        if (!response.ok) return;
        const reservation = await response.json();
        const detailsOverlay = document.getElementById('reservationDetails');
        detailsOverlay.style.display = 'flex';
        const detailsContent = document.getElementById('reservationDetailsContent');
        detailsContent.innerHTML = buildReservationDetails(reservation);
        if (window.lucide) lucide.createIcons({ parent: detailsContent });
    } catch (error) {
        console.error('Error cargando detalles de la reserva', error);
    }
}

function buildReservationDetails(r) {
    const estadoConfig = {
        pendiente:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: 'clock' },
        confirmada:   { color: '#10b981', bg: 'rgba(16,185,129,0.15)',  icon: 'check-circle-2' },
        cancelada:    { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: 'x-circle' },
        completada:   { color: '#2B6CB0', bg: 'rgba(49,130,206,0.15)',  icon: 'check-circle' },
        'en proceso': { color: '#0D9488', bg: 'rgba(13,148,136,0.15)',  icon: 'door-open' },
    };
    const key = (r.NombreEstadoReserva || '').toLowerCase();
    const cfg = estadoConfig[key] || { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: 'help-circle' };
    const fmt = f => f ? new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC', day:'2-digit', month:'short', year:'numeric' }) : '—';
    const montoFmt = v => '$' + Number(v || 0).toLocaleString('es-CO');

    const todosServicios = r.servicios || [];
    const serviciosOriginales = todosServicios.filter(s => !s.AgregadoEnProceso);
    const serviciosEnProceso  = todosServicios.filter(s =>  s.AgregadoEnProceso);
    const serviciosPendientes = serviciosEnProceso.filter(s => !s.Pagado);
    const montoAdicionalPend  = serviciosPendientes.reduce((sum, s) => sum + Number(s.Subtotal || 0), 0);
    const montoTotalReal = Number(r.MontoTotal || 0) + montoAdicionalPend;

    const alojamiento = r.NombreHabitacion || r.NombreCabana || r.NombrePaquete || '—';
    const alojTipo    = r.NombrePaquete ? 'Paquete' : r.NombreCabana ? 'Cabaña' : 'Habitación';

    const renderTag = (s) => {
        const precioUnit = s.PrecioUnitario || s.Costo || s.precio || 0;
        const cant = s.Cantidad || 1;
        const totalS = s.Subtotal || (precioUnit * cant);
        const extra = cant > 1 ? ` <span style="opacity:0.7;font-weight:400;">(x${cant})</span>` : '';
        return `<span class="rd-tag">${s.NombreServicio || s.nombre}
            <span style="margin-left:0.35rem;font-weight:700;color:#2B6CB0;">$${Number(totalS).toLocaleString('es-CO')}${extra}</span>
        </span>`;
    };
    const renderTagEnProceso = (s) => {
        const precioUnit = s.PrecioUnitario || s.Costo || s.precio || 0;
        const cant = s.Cantidad || 1;
        const totalS = s.Subtotal || (precioUnit * cant);
        const badge = s.Pagado
            ? `<span style="margin-left:0.4rem;font-size:0.68rem;background:#d1fae5;color:#065f46;border-radius:4px;padding:1px 5px;font-weight:600;">Pagado</span>`
            : `<span style="margin-left:0.4rem;font-size:0.68rem;background:#fef3c7;color:#92400e;border-radius:4px;padding:1px 5px;font-weight:600;">Pendiente</span>`;
        return `<span class="rd-tag">${s.NombreServicio || s.nombre}${badge}
            <span style="margin-left:0.35rem;font-weight:700;color:#b45309;">$${Number(totalS).toLocaleString('es-CO')}</span>
        </span>`;
    };

    const serviciosOrigHtml = serviciosOriginales.length > 0
        ? serviciosOriginales.map(renderTag).join('')
        : '<span style="color:rgba(26,43,74,0.45);font-size:0.8rem;">Sin servicios adicionales</span>';
    const serviciosEnProcHtml = serviciosEnProceso.length > 0
        ? serviciosEnProceso.map(renderTagEnProceso).join('')
        : null;

    return `
    <div class="rd-wrap">

      <!-- Cabecera -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid rgba(49,130,206,0.1);">
        <div>
          <h2 style="margin:0;font-size:1.1rem;font-weight:700;color:#1A2B4A;">
            Detalles de la Reserva <span style="color:rgba(26,43,74,0.4);font-size:0.9rem;font-weight:400;">#${r.IdReserva}</span>
          </h2>
          <span class="rd-badge" style="margin-top:0.4rem;color:${cfg.color};background:${cfg.bg};border-color:${cfg.color}44;">
            <i data-lucide="${cfg.icon}" style="width:11px;height:11px;"></i>
            ${r.NombreEstadoReserva || '—'}
          </span>
        </div>
        <button onclick="ocultarDetalles()" style="background:none;border:none;font-size:1.5rem;color:rgba(26,43,74,0.35);cursor:pointer;padding:0.2rem 0.5rem;border-radius:8px;line-height:1;transition:background .15s;" onmouseover="this.style.background='rgba(26,43,74,0.07)'" onmouseout="this.style.background='none'">×</button>
      </div>

      <!-- Franja de resumen -->
      <div class="rd-hero" style="border-top:3px solid ${cfg.color};">
        <div class="rd-hero__left">
          <span class="rd-hero__id"># ${r.IdReserva}</span>
        </div>
        <div class="rd-hero__center">
          <span class="rd-hero__label">${montoAdicionalPend > 0 ? 'Total acumulado' : 'Total a pagar'}</span>
          <span class="rd-hero__amount" style="color:#1A2B4A;">
            <span style="color:#10b981;">$</span>${montoTotalReal.toLocaleString('es-CO')}
          </span>
          ${montoAdicionalPend > 0 ? `<span style="font-size:0.7rem;color:#6b7280;margin-top:2px;">Original: $${Number(r.MontoTotal||0).toLocaleString('es-CO')} + Adicional: $${montoAdicionalPend.toLocaleString('es-CO')}</span>` : ''}
        </div>
        <div class="rd-hero__right">
          <span class="rd-hero__label">Reservado el</span>
          <span class="rd-hero__date">${fmt(r.FechaReserva || null)}</span>
        </div>
      </div>

      <!-- Grid 2×2 de datos -->
      <div class="rd-grid">
        <div class="rd-card">
          <div class="rd-card__icon" style="background:rgba(123,47,247,0.15);border-color:rgba(123,47,247,0.3);color:#9b59f5;">
            <i data-lucide="user" style="width:16px;height:16px;"></i>
          </div>
          <div class="rd-card__content">
            <span class="rd-card__label">Cliente</span>
            <span class="rd-card__value">${r.NombreUsuario || '—'}</span>
            <span class="rd-card__sub">${r.NroDocumentoCliente ? 'Doc: ' + r.NroDocumentoCliente : ''}</span>
          </div>
        </div>
        <div class="rd-card">
          <div class="rd-card__icon" style="background:rgba(49,130,206,0.12);border-color:rgba(49,130,206,0.3);color:#2B6CB0;">
            <i data-lucide="home" style="width:16px;height:16px;"></i>
          </div>
          <div class="rd-card__content">
            <span class="rd-card__label">Alojamiento</span>
            <span class="rd-card__value">${alojamiento}</span>
            <span class="rd-card__sub">${alojTipo}</span>
          </div>
        </div>
        <div class="rd-card">
          <div class="rd-card__icon" style="background:rgba(16,185,129,0.12);border-color:rgba(16,185,129,0.3);color:#10b981;">
            <i data-lucide="calendar-range" style="width:16px;height:16px;"></i>
          </div>
          <div class="rd-card__content">
            <span class="rd-card__label">Estadía</span>
            <div class="rd-dates">
              <span><i data-lucide="log-in" style="width:11px;color:#10b981;"></i> ${fmt(r.FechaInicio)}</span>
              <span style="color:rgba(26,43,74,0.35);">→</span>
              <span><i data-lucide="log-out" style="width:11px;color:#ef4444;"></i> ${fmt(r.FechaFinalizacion)}</span>
            </div>
          </div>
        </div>
        <div class="rd-card">
          <div class="rd-card__icon" style="background:rgba(245,158,11,0.12);border-color:rgba(245,158,11,0.3);color:#f59e0b;">
            <i data-lucide="credit-card" style="width:16px;height:16px;"></i>
          </div>
          <div class="rd-card__content">
            <span class="rd-card__label">Método de pago</span>
            <span class="rd-card__value">${r.NomMetodoPago || '—'}</span>
            <div class="rd-amounts">
              <span>Subtotal: <b>${montoFmt(r.SubTotal)}</b></span>
              ${r.Descuento ? `<span>Dto: <b>${r.Descuento}%</b></span>` : ''}
              ${r.IVA ? `<span>IVA: <b>${r.IVA}%</b></span>` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Aviso pago adicional -->
      ${montoAdicionalPend > 0 ? `
      <div style="margin:0 1rem 0;padding:0.75rem 1rem;background:rgba(245,158,11,0.1);border:1.5px solid rgba(245,158,11,0.45);border-radius:10px;display:flex;align-items:flex-start;gap:0.6rem;">
        <i data-lucide="alert-triangle" style="width:18px;flex-shrink:0;color:#b45309;margin-top:1px;"></i>
        <div style="font-size:0.8rem;color:#92400e;line-height:1.5;">
          <strong>Tienes $${montoAdicionalPend.toLocaleString('es-CO')} en servicios adicionales pendientes de pago.</strong><br>
          Debes cancelarlos antes o durante el check-out para poder completar tu reserva.
        </div>
      </div>` : ''}

      <!-- Servicios incluidos -->
      <div class="rd-section">
        <span class="rd-section__label">
          <i data-lucide="sparkles" style="width:13px;color:#f59e0b;"></i>
          Servicios incluidos en la reserva
        </span>
        <div class="rd-tags">${serviciosOrigHtml}</div>
      </div>

      <!-- Servicios agregados durante la estadía -->
      ${serviciosEnProcHtml ? `
      <div class="rd-section">
        <span class="rd-section__label">
          <i data-lucide="plus-circle" style="width:13px;color:#b45309;"></i>
          Servicios agregados durante la estadía
        </span>
        <div class="rd-tags">${serviciosEnProcHtml}</div>
      </div>` : ''}

      <!-- Acciones -->
      <div style="padding:1rem 1.25rem;border-top:1px solid rgba(49,130,206,0.1);display:flex;gap:0.75rem;justify-content:flex-end;">
        ${[3, 4].includes(r.IdEstadoReserva) ? '' : `<button class="btn btn-primario" onclick="abrirEdicion(${r.IdReserva})">Editar Reserva</button>`}
        <button class="btn btn-outline" onclick="ocultarDetalles()">Cerrar</button>
      </div>

    </div>`;
}

function ocultarDetalles() {
    const details = document.getElementById('reservationDetails');
    details.style.display = 'none';
    document.getElementById('reservationDetailsContent').innerHTML = '';
}

async function abrirEdicion(id) {
    try {
        const [resR] = await Promise.all([
            fetch(`/api/reservas/${id}`),
            cargarHabitaciones(),
            cargarCabanas(),
            cargarPaquetes(),
            cargarServicios(),
            cargarMetodosPagoModal(),
        ]);
        if (!resR.ok) return;
        const reservation = await resR.json();

        // Guard defensivo: una reserva en estado terminal (Cancelada/Completada) no se puede editar,
        // aunque se haya invocado abrirEdicion() sin pasar por el botón (que ya está oculto en ese caso).
        if ([3, 4].includes(reservation.IdEstadoReserva)) {
            alert(`Esta reserva ya fue ${reservation.IdEstadoReserva === 4 ? 'completada' : 'cancelada'} y no se puede modificar.`);
            return;
        }

        document.getElementById('editModalTitle').textContent = `Editar Reserva #${id}`;
        populateEditForm(reservation);
        document.getElementById('editModal').style.display = 'flex';
    } catch (error) {
        console.error('Error cargando reserva para editar', error);
    }
}

function populateEditForm(reservation) {
    document.getElementById('editIdReserva').value = reservation.IdReserva;

    esReservaEnProceso = reservation.IdEstadoReserva === 5;
    serviciosExistentesIds = new Set((reservation.servicios || []).map(s => Number(s.IDServicio)));

    let tipoActual = 'habitacion';
    let idAlojActual = null;
    let idPaqueteAdicional = null;

    if (reservation.IDCabana) {
        tipoActual = 'cabana';     idAlojActual = reservation.IDCabana;
        idPaqueteAdicional = reservation.IDPaquete || null;
    } else if (reservation.IDHabitacion) {
        tipoActual = 'habitacion'; idAlojActual = reservation.IDHabitacion;
        idPaqueteAdicional = reservation.IDPaquete || null;
    } else if (reservation.IDPaquete) {
        tipoActual = 'paquete';    idAlojActual = reservation.IDPaquete;
    }

    document.getElementById('editTipoAloj').value = tipoActual;
    document.getElementById('editAlojamiento').innerHTML = renderOpcionesEdicion(tipoActual, idAlojActual);
    const labels = { habitacion: 'Selecciona una habitación', cabana: 'Selecciona una cabaña', paquete: 'Selecciona un paquete' };
    document.getElementById('editAlojLabel').textContent = labels[tipoActual];
    updateTabStyles(tipoActual);

    // Poblar y configurar paquete adicional
    populatePaqueteAdicional(idPaqueteAdicional);
    const paqWrap = document.getElementById('editPaqueteAdicionalWrap');
    if (paqWrap) paqWrap.style.display = tipoActual === 'paquete' ? 'none' : '';

    document.getElementById('editFechaInicio').value = reservation.FechaInicio ? reservation.FechaInicio.split('T')[0] : '';
    document.getElementById('editFechaFinalizacion').value = reservation.FechaFinalizacion ? reservation.FechaFinalizacion.split('T')[0] : '';
    document.getElementById('editMetodoPago').value = reservation.MetodoPago || '';

    renderServiciosCheckboxes(reservation.servicios || []);
    calcularTotalEdicion();

    // Bloquear campos si la reserva está En Proceso
    const banner = document.getElementById('editEnProcesoBanner');
    if (banner) {
        if (esReservaEnProceso) {
            const montoAdicPend = Number(reservation.MontoAdicional || 0);
            banner.style.display = 'flex';
            banner.querySelector('.ep-monto-aviso').style.display = montoAdicPend > 0 ? '' : 'none';
            const montoEl = banner.querySelector('.ep-monto-valor');
            if (montoEl) montoEl.textContent = `$${montoAdicPend.toLocaleString('es-CO')}`;
        } else {
            banner.style.display = 'none';
        }
    }
    ['editFechaInicio', 'editFechaFinalizacion', 'editMetodoPago', 'editAlojamiento', 'editPaqueteAdicional'].forEach(fId => {
        const el = document.getElementById(fId);
        if (el) { el.disabled = esReservaEnProceso; el.style.opacity = esReservaEnProceso ? '0.6' : ''; }
    });
    ['editTabHab', 'editTabCab', 'editTabPaq'].forEach(tId => {
        const btn = document.getElementById(tId);
        if (btn) { btn.disabled = esReservaEnProceso; btn.style.opacity = esReservaEnProceso ? '0.45' : '1'; btn.style.cursor = esReservaEnProceso ? 'not-allowed' : 'pointer'; }
    });
    if (esReservaEnProceso) {
        const pw = document.getElementById('editPaqueteAdicionalWrap');
        if (pw) pw.style.display = 'none';
    }
}

window.editAjustarCantidad = function(id, delta) {
    const input = document.querySelector(`.edit-srv-qty[data-servicio-id="${id}"]`);
    if (!input) return;
    input.value = Math.max(1, Math.min(20, parseInt(input.value || 1) + delta));
    calcularTotalEdicion();
};

function renderServiciosCheckboxes(selectedServices = []) {
    const container = document.getElementById('editServiciosContainer');
    container.innerHTML = '';
    const selectedMap = new Map(selectedServices.map(s => [s.IDServicio, Number(s.Cantidad || 1)]));

    serviciosData.forEach(servicio => {
        const div = document.createElement('div');
        const costoS = Number(servicio.Costo || servicio.precio || 0);
        const isChecked = selectedMap.has(servicio.IDServicio);
        const cantidad = selectedMap.get(servicio.IDServicio) || 1;

        div.style.cssText = 'display:flex;flex-direction:column;gap:0.25rem;padding:0.45rem 0.65rem;border-radius:8px;border:1.5px solid rgba(49,130,206,0.15);background:#f8fbff;';
        div.innerHTML = `
            <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-size:0.79rem;color:#1A2B4A;margin:0;">
                <input type="checkbox" class="edit-servicio-check" value="${servicio.IDServicio}"
                       data-costo="${costoS}" ${isChecked ? 'checked' : ''}
                       style="width:15px;height:15px;accent-color:#2B6CB0;flex-shrink:0;"
                       onchange="calcularTotalEdicion()">
                <span style="flex:1;font-weight:600;">${servicio.NombreServicio || servicio.nombre || 'Servicio'}</span>
                <span style="color:#2B6CB0;font-weight:700;white-space:nowrap;font-size:0.75rem;">$${costoS.toLocaleString('es-CO')}/p</span>
            </label>
            <div style="display:flex;align-items:center;gap:0.35rem;padding-left:1.4rem;">
                <span style="font-size:0.68rem;color:rgba(26,43,74,0.5);">Cant:</span>
                <button type="button" onclick="editAjustarCantidad('${servicio.IDServicio}',-1)"
                        style="width:20px;height:20px;border-radius:50%;border:1px solid rgba(43,108,176,0.3);background:#fff;color:#2B6CB0;cursor:pointer;font-size:0.85rem;font-weight:700;line-height:1;padding:0;">−</button>
                <input type="number" class="edit-srv-qty" data-servicio-id="${servicio.IDServicio}"
                       min="1" max="20" value="${cantidad}"
                       style="width:36px;text-align:center;border:1px solid rgba(43,108,176,0.25);border-radius:4px;font-size:0.78rem;padding:2px 0;color:#1A2B4A;"
                       oninput="calcularTotalEdicion()">
                <button type="button" onclick="editAjustarCantidad('${servicio.IDServicio}',1)"
                        style="width:20px;height:20px;border-radius:50%;border:1px solid rgba(43,108,176,0.3);background:#fff;color:#2B6CB0;cursor:pointer;font-size:0.85rem;font-weight:700;line-height:1;padding:0;">+</button>
                <span class="edit-srv-total" data-servicio-id="${servicio.IDServicio}"
                      style="font-size:0.72rem;color:#2B6CB0;font-weight:700;margin-left:0.1rem;"></span>
            </div>
        `;
        container.appendChild(div);
    });
    calcularTotalEdicion();
}

function calcularTotalEdicion() {
    const inicio = document.getElementById('editFechaInicio')?.value;
    const fin    = document.getElementById('editFechaFinalizacion')?.value;
    const noches = (inicio && fin && new Date(fin) > new Date(inicio))
        ? Math.round((new Date(fin) - new Date(inicio)) / 86400000) : 1;

    const alojSelect    = document.getElementById('editAlojamiento');
    const alojPrecio    = alojSelect ? Number(alojSelect.selectedOptions[0]?.dataset.precio || 0) : 0;
    const paqAdicSelect = document.getElementById('editPaqueteAdicional');
    const paqAdicPrecio = paqAdicSelect?.value ? Number(paqAdicSelect.selectedOptions[0]?.dataset.precio || 0) : 0;

    const totalServicios = Array.from(document.querySelectorAll('.edit-servicio-check:checked'))
        .reduce((sum, cb) => {
            const qty = parseInt(document.querySelector(`.edit-srv-qty[data-servicio-id="${cb.value}"]`)?.value || 1);
            return sum + Number(cb.dataset.costo || 0) * qty;
        }, 0);

    // Actualizar totales por servicio
    document.querySelectorAll('.edit-servicio-check').forEach(cb => {
        const qty = parseInt(document.querySelector(`.edit-srv-qty[data-servicio-id="${cb.value}"]`)?.value || 1);
        const t = Number(cb.dataset.costo || 0) * qty;
        const lbl = document.querySelector(`.edit-srv-total[data-servicio-id="${cb.value}"]`);
        if (lbl) { lbl.textContent = cb.checked && qty > 1 ? `= $${t.toLocaleString('es-CO')}` : ''; lbl.style.color = '#2B6CB0'; }
    });

    const subtotal = (alojPrecio + paqAdicPrecio) * noches + totalServicios;
    const total    = subtotal + subtotal * 0.19;

    const el = document.getElementById('editMontoTotal');
    if (el) el.value = `$${total.toLocaleString('es-CO')}`;
}

async function guardarEdicion() {
    const id = document.getElementById('editIdReserva').value;

    // Reserva En Proceso: solo se pueden agregar servicios adicionales
    if (esReservaEnProceso) {
        const serviciosAdicionales = Array.from(document.querySelectorAll('.edit-servicio-check:checked'))
            .map(el => ({
                IDServicio: parseInt(el.value),
                Cantidad: parseInt(document.querySelector(`.edit-srv-qty[data-servicio-id="${el.value}"]`)?.value || 1)
            }));
        try {
            const response = await fetch(`/api/reservas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviciosAdicionales }),
            });
            if (response.ok) {
                cerrarModal();
                await loadReservations();
                await loadReservationDetails(id);
            } else {
                const error = await response.json();
                alert(error.message || 'Error al actualizar la reserva');
            }
        } catch (e) {
            alert('Error de conexión');
        }
        return;
    }

    const tipo    = document.getElementById('editTipoAloj').value;
    const idAloj  = document.getElementById('editAlojamiento').value;
    const serviciosAdicionales = Array.from(document.querySelectorAll('.edit-servicio-check:checked'))
        .map(el => ({
            IDServicio: parseInt(el.value),
            Cantidad: parseInt(document.querySelector(`.edit-srv-qty[data-servicio-id="${el.value}"]`)?.value || 1)
        }));

    const data = {
        serviciosAdicionales,
        FechaInicio:       document.getElementById('editFechaInicio').value,
        FechaFinalizacion: document.getElementById('editFechaFinalizacion').value,
        MetodoPago: parseInt(document.getElementById('editMetodoPago').value),
    };
    if (tipo === 'habitacion') data.IDHabitacion = parseInt(idAloj);
    else if (tipo === 'cabana')   data.IDCabana    = parseInt(idAloj);
    else if (tipo === 'paquete')  data.IDPaquete   = parseInt(idAloj);
    // Paquete adicional: solo aplica cuando el alojamiento es habitación o cabaña
    if (tipo !== 'paquete') {
        const paqAdicId = document.getElementById('editPaqueteAdicional')?.value;
        if (paqAdicId) data.IDPaquete = parseInt(paqAdicId);
    }

    try {
        const response = await fetch(`/api/reservas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (response.ok) {
            cerrarModal();
            await loadReservations();
            await loadReservationDetails(id);
        } else {
            const error = await response.json();
            alert(error.message || 'Error al actualizar la reserva');
        }
    } catch (error) {
        alert('Error de conexión');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE CANCELACIÓN — UX de 2 pasos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paso 1: Solicita la cancelación al backend para obtener la política aplicable.
 * Si es gratuita → cancela directo y muestra resultado.
 * Si tiene penalización → muestra el modal de confirmación.
 */
async function solicitarCancelacion(id, montoTotal) {
    try {
        const response = await fetch(`/api/reservas/${id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})   // primer llamado sin confirmación
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Error al procesar la cancelación.');
            return;
        }

        // El backend requiere confirmación explícita (hay penalización)
        if (data.requiresConfirmation) {
            poblarModalCancelacion(id, montoTotal, data.politica, data.mensaje);
            document.getElementById('cancelRequieresConfirmacion').value = 'true';
            document.getElementById('cancelModal').style.display = 'flex';
            return;
        }

        // Cancelación gratuita ejecutada directamente
        if (data.cancelado) {
            mostrarResultadoCancelacion(data.data || data, montoTotal);
            await loadReservations();
            ocultarDetalles();
        }

    } catch (error) {
        console.error('Error solicitando cancelación:', error);
        alert('Error de conexión. Por favor intenta de nuevo.');
    }
}

/**
 * Rellena el modal de cancelación con la información de la política.
 */
function poblarModalCancelacion(id, montoTotal, politica, mensajeExtra) {
    document.getElementById('cancelReservaId').value = id;

    const esGratuita = politica.tipoCancelacion === 'gratuita';

    // Badge de tipo
    const badge = document.getElementById('cancelTipoBadge');
    badge.textContent = esGratuita ? '✅ Cancelación Gratuita' : `⚠️ Cancelación con Penalización (${politica.porcentajePenalizacion}%)`;
    badge.style.background = esGratuita ? '#10b981' : '#ef4444';
    badge.style.color = '#fff';

    // Mensaje de política
    const politicaBox = document.getElementById('cancelPoliticaBox');
    politicaBox.style.borderLeftColor = esGratuita ? '#10b981' : '#f59e0b';
    politicaBox.style.background = esGratuita ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)';
    document.getElementById('cancelPoliticaMensaje').textContent = mensajeExtra || politica.mensaje || '';

    // Resumen financiero
    document.getElementById('cancelMontoTotal').textContent = formatCurrency(montoTotal);
    document.getElementById('cancelPenalizacionLabel').textContent =
        esGratuita ? 'Penalización aplicada' : `Penalización (${politica.porcentajePenalizacion}%)`;
    document.getElementById('cancelPenalizacionValor').textContent =
        esGratuita ? '$0 (sin cargo)' : formatCurrency(politica.valorPenalizacion);
    document.getElementById('cancelPenalizacionValor').style.color = esGratuita ? '#10b981' : '#ef4444';
    document.getElementById('cancelReembolsoValor').textContent = formatCurrency(politica.valorReembolso);

    // Subtítulo del modal
    document.getElementById('cancelModalSubtitle').textContent =
        esGratuita ? 'Esta cancelación no generará ningún cargo.' : '⚠️ Esta cancelación generará un cargo de penalización.';
}

/**
 * Paso 2: El usuario ya vio la política y confirma la cancelación.
 * Envía confirmarConPenalizacion=true para ejecutar la cancelación en la BD.
 */
async function ejecutarCancelacion() {
    const id = document.getElementById('cancelReservaId').value;
    const montoEl = document.getElementById('cancelMontoTotal').textContent;
    // Extraer el número del texto formateado
    const montoTotal = parseFloat(montoEl.replace(/[^0-9,.]/g, '').replace(',', '.')) || 0;

    const btn = document.getElementById('cancelConfirmBtn');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    try {
        const response = await fetch(`/api/reservas/${id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confirmarConPenalizacion: true })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Error al cancelar la reserva.');
            btn.disabled = false;
            btn.textContent = '❌ Confirmar cancelación';
            return;
        }

        cerrarModalCancelacion();
        mostrarResultadoCancelacion(data.data || data, montoTotal);
        await loadReservations();
        ocultarDetalles();

    } catch (error) {
        console.error('Error ejecutando cancelación:', error);
        alert('Error de conexión. Por favor intenta de nuevo.');
        btn.disabled = false;
        btn.textContent = '❌ Confirmar cancelación';
    }
}

/**
 * Muestra el modal de resultado con el resumen financiero de la cancelación.
 */
function mostrarResultadoCancelacion(data, montoTotalFallback) {
    const politica = data.politica || {};
    const esGratuita = (politica.tipoCancelacion || '') === 'gratuita';
    const montoTotal = montoTotalFallback || 0;

    // Ícono y badge
    document.getElementById('cancelResultIcon').textContent = esGratuita ? '✅' : '⚠️';
    const badge = document.getElementById('cancelResultBadge');
    badge.textContent = esGratuita ? '✅ Cancelación Gratuita' : `⚠️ Penalización del ${politica.porcentajePenalizacion || 40}%`;
    badge.style.background = esGratuita ? '#10b981' : '#ef4444';
    badge.style.color = '#fff';

    // Subtítulo
    document.getElementById('cancelResultSubtitle').textContent =
        esGratuita
            ? 'Tu reserva fue cancelada sin ningún cargo. Recibirás el reembolso completo.'
            : 'Tu reserva fue cancelada. Revisa los valores a continuación.';

    // Resumen financiero
    document.getElementById('cancelResultTotal').textContent = formatCurrency(montoTotal);
    document.getElementById('cancelResultPenLabel').textContent =
        esGratuita ? 'Penalización aplicada' : `Penalización retenida (${politica.porcentajePenalizacion || 0}%)`;
    document.getElementById('cancelResultPenValor').textContent =
        esGratuita ? '$0 (sin cargo)' : formatCurrency(politica.valorPenalizacion || 0);
    document.getElementById('cancelResultPenValor').style.color = esGratuita ? '#10b981' : '#ef4444';
    document.getElementById('cancelResultReembolso').textContent = formatCurrency(politica.valorReembolso || montoTotal);

    // Mensaje
    document.getElementById('cancelResultMensaje').textContent = data.mensaje || politica.mensaje || '';

    document.getElementById('cancelResultModal').style.display = 'flex';
}

function cerrarModalCancelacion() {
    document.getElementById('cancelModal').style.display = 'none';
    const btn = document.getElementById('cancelConfirmBtn');
    if (btn) { btn.disabled = false; btn.textContent = '❌ Confirmar cancelación'; }
}

function cerrarResultadoCancelacion() {
    document.getElementById('cancelResultModal').style.display = 'none';
}

function cerrarModal() {
    document.getElementById('editModal').style.display = 'none';
}

function handleFormChange(event) {
    if (event.target.matches('#editAlojamiento') || event.target.matches('.edit-servicio-check')) {
        calcularTotalEdicion();
    }
}

document.getElementById('editReservationForm').addEventListener('change', handleFormChange);

(async function initializePage() {
    await loadReservations();
})();

