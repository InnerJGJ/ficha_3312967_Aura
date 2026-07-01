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
        pendiente:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'  },
        confirmada:   { color: '#10b981', bg: 'rgba(16,185,129,0.15)'  },
        cancelada:    { color: '#ef4444', bg: 'rgba(239,68,68,0.15)'   },
        completada:   { color: '#2B6CB0', bg: 'rgba(49,130,206,0.15)'  },
        'en proceso': { color: '#0D9488', bg: 'rgba(13,148,136,0.15)'  },
    };
    const key = (r.NombreEstadoReserva || '').toLowerCase();
    const cfg = estadoConfig[key] || { color: '#6b7280', bg: 'rgba(107,114,128,0.15)' };
    const fmt = f => f ? new Date(f).toLocaleDateString('es-CO', { timeZone: 'UTC', day:'2-digit', month:'short', year:'numeric' }) : '—';
    const mFmt = v => '$' + Number(v || 0).toLocaleString('es-CO');

    const alojamiento = r.NombreHabitacion || r.NombreCabana || r.NombrePaquete || '—';
    const alojTipo    = r.NombrePaquete ? 'Paquete' : r.NombreCabana ? 'Cabaña' : 'Habitación';

    const todosServicios   = r.servicios || [];
    const serviciosOrig    = todosServicios.filter(s => !s.AgregadoEnProceso);
    const serviciosAdic    = todosServicios.filter(s =>  s.AgregadoEnProceso);
    const montoAdicPend    = serviciosAdic.filter(s => !s.Pagado).reduce((sum, s) => sum + Number(s.Subtotal || 0), 0);
    const montoTotalReal   = Number(r.MontoTotal || 0) + montoAdicPend;

    const noches = (r.FechaInicio && r.FechaFinalizacion)
        ? Math.max(1, Math.round((new Date(r.FechaFinalizacion) - new Date(r.FechaInicio)) / 86400000))
        : 1;
    const totalServOrig = serviciosOrig.reduce((s, x) => s + Number(x.Subtotal || (Number(x.PrecioUnitario||0) * Number(x.Cantidad||1))), 0);
    const alojTotal = Math.max(0, Number(r.SubTotal || 0) - totalServOrig);
    const alojUnit  = noches > 0 ? Math.round(alojTotal / noches) : alojTotal;
    const idNum = String(r.IdReserva || '').padStart(6, '0');

    const trSrv = (s, esAdic) => {
        const pu  = Number(s.PrecioUnitario || s.Costo || 0);
        const qty = Number(s.Cantidad || 1);
        const tot = Number(s.Subtotal || (pu * qty));
        const badge = esAdic
            ? (s.Pagado
                ? `<span style="font-size:0.65rem;background:#d1fae5;color:#065f46;border-radius:4px;padding:1px 5px;font-weight:600;margin-left:6px;">Pagado</span>`
                : `<span style="font-size:0.65rem;background:#fef3c7;color:#92400e;border-radius:4px;padding:1px 5px;font-weight:600;margin-left:6px;">Pendiente</span>`)
            : '';
        return `<tr>
          <td><div class="inv-td__name">${s.NombreServicio || '—'}${badge}</div><div class="inv-td__detail">Servicio</div></td>
          <td class="inv-td--r">${qty}</td>
          <td class="inv-td--r">$${pu.toLocaleString('es-CO')}</td>
          <td class="inv-td--rw"${esAdic ? ' style="color:#b45309;"' : ''}>$${tot.toLocaleString('es-CO')}</td>
        </tr>`;
    };

    const canEdit = ![3, 4].includes(r.IdEstadoReserva);

    return `<div class="inv-wrap">

      <div class="inv-header">
        <div class="inv-brand">
          <div class="inv-brand__logo">AT</div>
          <div>
            <div class="inv-brand__name">Aura Travel</div>
            <div class="inv-brand__sub">Reservas &amp; Alojamiento</div>
          </div>
        </div>
        <div class="inv-title-block">
          <div class="inv-doc-type">Comprobante de Reserva</div>
          <div class="inv-number"># ${idNum}</div>
          <div class="inv-issue-date">Emitido: ${fmt(r.FechaReserva)}</div>
        </div>
      </div>

      <div class="inv-info">
        <div class="inv-info__col">
          <div class="inv-info__label">Emitido a</div>
          <div class="inv-info__value">${r.NombreUsuario || '—'}</div>
          ${r.NroDocumentoCliente ? `<div class="inv-info__sub">Doc: ${r.NroDocumentoCliente}</div>` : ''}
        </div>
        <div class="inv-info__col">
          <div class="inv-info__label">Detalles de la reserva</div>
          <span class="inv-status" style="color:${cfg.color};border-color:${cfg.color}44;background:${cfg.bg};">${r.NombreEstadoReserva || '—'}</span>
          <div class="inv-info__row"><span><b>Alojamiento:</b> ${alojamiento} (${alojTipo})</span></div>
          <div class="inv-info__row">
            <span><b>Entrada:</b> ${fmt(r.FechaInicio)}</span>
            <span><b>Salida:</b> ${fmt(r.FechaFinalizacion)}</span>
          </div>
          <div class="inv-info__row"><span><b>Pago:</b> ${r.NomMetodoPago || '—'}</span></div>
        </div>
      </div>

      <div class="inv-table-wrap">
        <table class="inv-table">
          <thead>
            <tr>
              <th>Descripción</th><th class="r">Cant.</th><th class="r">P. Unit.</th><th class="r">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr class="inv-tr--aloj">
              <td>
                <div class="inv-td__name">${alojamiento}</div>
                <div class="inv-td__detail">${alojTipo} · ${noches} noche${noches !== 1 ? 's' : ''}</div>
              </td>
              <td class="inv-td--r">${noches}</td>
              <td class="inv-td--r">$${alojUnit.toLocaleString('es-CO')}</td>
              <td class="inv-td--rw">$${alojTotal.toLocaleString('es-CO')}</td>
            </tr>
            ${serviciosOrig.map(s => trSrv(s, false)).join('')}
          </tbody>
        </table>
      </div>

      ${serviciosAdic.length > 0 ? `
      <div class="inv-sep"><div class="inv-sep__label">Servicios agregados durante la estadía</div></div>
      <div class="inv-table-wrap">
        <table class="inv-table"><tbody>
          ${serviciosAdic.map(s => trSrv(s, true)).join('')}
        </tbody></table>
      </div>` : ''}

      <div class="inv-totals">
        <div class="inv-totals__row"><span>Subtotal:</span><b>${mFmt(r.SubTotal)}</b></div>
        <div class="inv-totals__row"><span>IVA (19%):</span><b>${mFmt(r.IVA)}</b></div>
        <hr class="inv-totals__divider">
        <div class="inv-totals__grand"><span>Total:</span><span>${mFmt(r.MontoTotal)}</span></div>
        ${montoAdicPend > 0 ? `
        <div class="inv-totals__warn">⚠️ $${montoAdicPend.toLocaleString('es-CO')} en servicios pendientes de pago al check-out</div>
        <div class="inv-totals__acum"><span>Total acumulado:</span><span>$${montoTotalReal.toLocaleString('es-CO')}</span></div>` : ''}
      </div>

      <div class="inv-footer">
        <button class="inv-btn inv-btn--ghost" onclick="window.print()">Imprimir</button>
        ${canEdit ? `<button class="inv-btn inv-btn--primary" onclick="abrirEdicion(${r.IdReserva})">Editar Reserva</button>` : ''}
        <button class="inv-btn inv-btn--outline" onclick="ocultarDetalles()">Cerrar</button>
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

    // FIX: Usar IDHabitacionDirecta (NULL si la reserva es solo paquete) para
    // evitar que la habitación interna del paquete se interprete como habitación directa
    // y duplique el costo en el cálculo del total.
    if (reservation.IDCabana) {
        tipoActual = 'cabana';     idAlojActual = reservation.IDCabana;
        idPaqueteAdicional = reservation.IDPaquete || null;
    } else if (reservation.IDHabitacionDirecta) {
        tipoActual = 'habitacion'; idAlojActual = reservation.IDHabitacionDirecta;
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
    const montoLabel = document.getElementById('editMontoTotalLabel');
    if (montoLabel) montoLabel.textContent = esReservaEnProceso ? 'Cargo adicional (nuevos servicios)' : 'Monto Total Estimado';
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
    // Actualizar etiquetas de total por servicio
    document.querySelectorAll('.edit-servicio-check').forEach(cb => {
        const qty = parseInt(document.querySelector(`.edit-srv-qty[data-servicio-id="${cb.value}"]`)?.value || 1);
        const t = Number(cb.dataset.costo || 0) * qty;
        const lbl = document.querySelector(`.edit-srv-total[data-servicio-id="${cb.value}"]`);
        if (lbl) { lbl.textContent = cb.checked && qty > 1 ? `= $${t.toLocaleString('es-CO')}` : ''; }
    });

    const el = document.getElementById('editMontoTotal');
    if (!el) return;

    if (esReservaEnProceso) {
        // En Proceso: solo sumar servicios NUEVOS (los que no estaban ya en la reserva)
        const totalNuevos = Array.from(document.querySelectorAll('.edit-servicio-check:checked'))
            .filter(cb => !serviciosExistentesIds.has(Number(cb.value)))
            .reduce((sum, cb) => {
                const qty = parseInt(document.querySelector(`.edit-srv-qty[data-servicio-id="${cb.value}"]`)?.value || 1);
                return sum + Number(cb.dataset.costo || 0) * qty;
            }, 0);
        el.value = `$${totalNuevos.toLocaleString('es-CO')}`;
        return;
    }

    // Reserva normal: cálculo completo
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

    // Los precios ya incluyen IVA. El backend usa precio fijo sin multiplicador de temporada.
    const total = (alojPrecio + paqAdicPrecio) * noches + totalServicios;
    el.value = `$${Math.round(total).toLocaleString('es-CO')}`;
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

