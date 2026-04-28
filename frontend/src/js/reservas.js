// Verificar sesión
const userData = localStorage.getItem('user');
if (!userData) window.location.href = '/src/pages/login.html';
const user = JSON.parse(userData || '{}');
if (!user.IDUsuario) {
  localStorage.removeItem('user');
  window.location.href = '/src/pages/login.html';
}

// Set user name and logout after components are loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for components to load
  setTimeout(() => {
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = `Hola, ${user.NombreUsuario}`;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = '/src/pages/login.html';
      });
    }
  }, 100);
});

let habitacionesData = [];
let paquetesData = [];
let serviciosData = [];

async function cargarHabitaciones() {
    const response = await fetch('/api/habitaciones');
    habitacionesData = await response.json();
    const select = document.getElementById('editIDHabitacion');
    select.innerHTML = '<option value="">Seleccione una habitación</option>';
    habitacionesData.forEach(h => {
        const option = document.createElement('option');
        option.value = h.IDHabitacion;
        option.textContent = `${h.NombreHabitacion} - $${h.Costo.toLocaleString()}`;
        option.dataset.costo = h.Costo;
        select.appendChild(option);
    });
}

async function cargarPaquetes() {
    const response = await fetch('/api/paquetes');
    paquetesData = await response.json();
    const select = document.getElementById('editIDPaquete');
    select.innerHTML = '<option value="">Seleccione un paquete</option>';
    paquetesData.forEach(p => {
        const option = document.createElement('option');
        option.value = p.IDPaquete;
        option.textContent = `${p.NombrePaquete} - $${p.Precio.toLocaleString()}`;
        option.dataset.precio = p.Precio;
        select.appendChild(option);
    });
}

async function cargarServicios() {
    const response = await fetch('/api/servicios');
    serviciosData = await response.json();
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
        const response = await fetch(`/api/reservations/user/${user.IDUsuario}`);
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

        list.innerHTML = reservations.map(r => `
            <div class="reservation-card">
                <div class="reservation-info">
                    <h3>Reserva #${r.IdReserva}</h3>
                    <p><strong>Habitación:</strong> ${r.NombreHabitacion || 'Sin asignar'}</p>
                    <p><strong>Paquete:</strong> ${r.NombrePaquete || 'Sin paquete'}</p>
                    <p><strong>Fechas:</strong> ${r.FechaInicio ? new Date(r.FechaInicio).toLocaleDateString() : '-'} - ${r.FechaFinalizacion ? new Date(r.FechaFinalizacion).toLocaleDateString() : '-'}</p>
                    <p><strong>Total:</strong> ${formatCurrency(r.MontoTotal || 0)}</p>
                    <p><strong>Estado:</strong> ${r.NombreEstadoReserva}</p>
                </div>
                <div class="reservation-actions">
                    <button class="btn" onclick="loadReservationDetails(${r.IdReserva})">Ver detalles</button>
                    <button class="btn btn-outline" onclick="abrirEdicion(${r.IdReserva})">Editar</button>
                    <button class="btn btn-danger" onclick="deleteReservation(${r.IdReserva})">Eliminar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando reservas', error);
    }
}

async function loadReservationDetails(id) {
    try {
        const response = await fetch(`/api/reservations/${id}`);
        if (!response.ok) return;
        const reservation = await response.json();
        const detailsOverlay = document.getElementById('reservationDetails');
        detailsOverlay.style.display = 'flex';
        const detailsContent = document.getElementById('reservationDetailsContent');
        detailsContent.innerHTML = buildReservationDetails(reservation);
    } catch (error) {
        console.error('Error cargando detalles de la reserva', error);
    }
}

function buildReservationDetails(r) {
    const serviciosHtml = (r.servicios || []).length > 0
        ? `<ul>${r.servicios.map(s => `<li>${s.NombreServicio} - ${formatCurrency(s.Costo)}</li>`).join('')}</ul>`
        : '<p style="color: var(--gris); margin: 0;">No hay servicios adicionales.</p>';

    return `
        <div class="reservation-details-card">
            <div class="details-header">
                <div>
                    <h3>Reserva #${r.IdReserva}</h3>
                    <p style="color: var(--gris); margin: 0.5rem 0 0;">Estado: ${r.NombreEstadoReserva}</p>
                </div>
                <div class="details-actions">
                    <button class="btn" onclick="abrirEdicion(${r.IdReserva})">Editar</button>
                    <button class="btn btn-outline" onclick="ocultarDetalles()">Cerrar</button>
                </div>
            </div>
            <div class="details-grid">
                <div>
                    <p><strong>Cliente:</strong> ${r.NombreUsuario}</p>
                    <p><strong>Número de documento:</strong> ${r.NroDocumentoCliente || '-'}</p>
                    <p><strong>Habitación:</strong> ${r.NombreHabitacion || '-'}</p>
                    <p><strong>Paquete:</strong> ${r.NombrePaquete || '-'}</p>
                </div>
                <div>
                    <p><strong>Método de pago:</strong> ${r.NomMetodoPago}</p>
                    <p><strong>Fecha inicio:</strong> ${r.FechaInicio ? new Date(r.FechaInicio).toLocaleDateString() : '-'}</p>
                    <p><strong>Fecha final:</strong> ${r.FechaFinalizacion ? new Date(r.FechaFinalizacion).toLocaleDateString() : '-'}</p>
                    <p><strong>Fecha de reserva:</strong> ${r.FechaReserva ? new Date(r.FechaReserva).toLocaleDateString() : '-'}</p>
                </div>
            </div>
            <div class="details-grid">
                <div>
                    <p><strong>Subtotal:</strong> ${formatCurrency(r.SubTotal || 0)}</p>
                    <p><strong>Descuento:</strong> ${formatCurrency(r.Descuento || 0)}</p>
                    <p><strong>IVA (19%):</strong> ${formatCurrency(r.IVA || 0)}</p>
                    <p><strong>Total:</strong> ${formatCurrency(r.MontoTotal || 0)}</p>
                </div>
            </div>
            <div class="details-services">
                <h4>Servicios Adicionales</h4>
                ${serviciosHtml}
            </div>
        </div>
    `;
}

function ocultarDetalles() {
    const details = document.getElementById('reservationDetails');
    details.style.display = 'none';
    document.getElementById('reservationDetailsContent').innerHTML = '';
}

async function abrirEdicion(id) {
    try {
        const response = await fetch(`/api/reservations/${id}`);
        if (!response.ok) return;
        const reservation = await response.json();
        await Promise.all([cargarHabitaciones(), cargarPaquetes(), cargarServicios(), cargarMetodosPagoModal()]);
        populateEditForm(reservation);
        document.getElementById('editModal').style.display = 'flex';
    } catch (error) {
        console.error('Error cargando reserva para editar', error);
    }
}

function populateEditForm(reservation) {
    document.getElementById('editIdReserva').value = reservation.IdReserva;
    document.getElementById('editIDPaquete').value = reservation.IDPaquete || '';
    document.getElementById('editIDHabitacion').value = reservation.IDPaquete ? '' : (reservation.IDHabitacion || '');
    document.getElementById('editFechaInicio').value = reservation.FechaInicio ? reservation.FechaInicio.split('T')[0] : '';
    document.getElementById('editFechaFinalizacion').value = reservation.FechaFinalizacion ? reservation.FechaFinalizacion.split('T')[0] : '';
    document.getElementById('editMetodoPago').value = reservation.MetodoPago || '';
    renderServiciosCheckboxes(reservation.servicios || []);
    updateEditSelectStates();
    calcularTotalEdicion();
}

function updateEditSelectStates() {
    const habitacionSelect = document.getElementById('editIDHabitacion');
    const paqueteSelect = document.getElementById('editIDPaquete');
    const habitacionSelected = habitacionSelect.value !== '';
    const paqueteSelected = paqueteSelect.value !== '';

    if (habitacionSelected) {
        paqueteSelect.disabled = true;
    } else if (paqueteSelected) {
        habitacionSelect.disabled = true;
    } else {
        habitacionSelect.disabled = false;
        paqueteSelect.disabled = false;
    }
}

function renderServiciosCheckboxes(selectedServices = []) {
    const container = document.getElementById('editServiciosContainer');
    container.innerHTML = '';
    const selectedIds = selectedServices.map(s => s.IDServicio);

    serviciosData.forEach(servicio => {
        const div = document.createElement('div');
        div.innerHTML = `
            <label>
                <input type="checkbox" class="edit-servicio-check" value="${servicio.IDServicio}" data-costo="${servicio.Costo}" ${selectedIds.includes(servicio.IDServicio) ? 'checked' : ''}>
                ${servicio.NombreServicio} - ${formatCurrency(servicio.Costo)}
            </label>
        `;
        container.appendChild(div);
    });
}

function calcularTotalEdicion() {
    const habitacionSelect = document.getElementById('editIDHabitacion');
    const paqueteSelect = document.getElementById('editIDPaquete');
    const habitacionCost = parseFloat(habitacionSelect.selectedOptions[0]?.dataset.costo || 0);
    const paquetePrice = parseFloat(paqueteSelect.selectedOptions[0]?.dataset.precio || 0);
    const serviciosSeleccionados = Array.from(document.querySelectorAll('.edit-servicio-check:checked'));
    const totalServicios = serviciosSeleccionados.reduce((sum, s) => sum + parseFloat(s.dataset.costo), 0);
    const subtotal = paquetePrice + habitacionCost + totalServicios;
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    document.getElementById('editSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('editIva').textContent = formatCurrency(iva);
    document.getElementById('editTotal').textContent = formatCurrency(total);
}

async function guardarEdicion() {
    const id = document.getElementById('editIdReserva').value;
    const servicioIds = Array.from(document.querySelectorAll('.edit-servicio-check:checked')).map(el => parseInt(el.value));
    const data = {
        IDHabitacion: parseInt(document.getElementById('editIDHabitacion').value),
        IDPaquete: parseInt(document.getElementById('editIDPaquete').value),
        serviciosAdicionales: servicioIds,
        FechaInicio: document.getElementById('editFechaInicio').value,
        FechaFinalizacion: document.getElementById('editFechaFinalizacion').value,
        MetodoPago: parseInt(document.getElementById('editMetodoPago').value)
    };

    try {
        const response = await fetch(`/api/reservations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
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

async function deleteReservation(id) {
    if (!confirm('¿Estás seguro de eliminar esta reserva?')) return;
    try {
        const response = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
        if (response.ok) {
            await loadReservations();
            ocultarDetalles();
        } else {
            alert('Error al eliminar la reserva');
        }
    } catch (error) {
        alert('Error de conexión');
    }
}

function cerrarModal() {
    document.getElementById('editModal').style.display = 'none';
}

function handleFormChange(event) {
    if (event.target.matches('#editIDHabitacion')) {
        if (event.target.value !== '') {
            document.getElementById('editIDPaquete').value = '';
        }
        updateEditSelectStates();
        calcularTotalEdicion();
    }
    
    if (event.target.matches('#editIDPaquete')) {
        if (event.target.value !== '') {
            document.getElementById('editIDHabitacion').value = '';
        }
        updateEditSelectStates();
        calcularTotalEdicion();
    }

    if (event.target.matches('.edit-servicio-check')) {
        calcularTotalEdicion();
    }
}

document.getElementById('editReservationForm').addEventListener('change', handleFormChange);

(async function initializePage() {
    await Promise.all([cargarHabitaciones(), cargarPaquetes(), cargarServicios(), cargarMetodosPagoModal()]);
    await loadReservations();
})();