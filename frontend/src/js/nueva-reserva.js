// Verificar sesión
const userData = localStorage.getItem('user');
if (!userData) window.location.href = '/page/index.html';
const user = JSON.parse(userData);

document.getElementById('userName').textContent = `Hola, ${user.NombreUsuario}`;

// Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = '/page/index.html';
});

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

document.addEventListener('click', (event) => {
    if (window.innerWidth <= 1080 && !sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
        sidebar.classList.remove('open');
    }
});

// Data global
let habitacionesData = [];
let paquetesData = [];
let serviciosData = [];
let allReservations = [];
let fpStart = null;
let fpEnd = null;

// Función para obtener las fechas deshabilitadas para una habitación
function getDisabledDatesForRoom(roomId) {
    if (!roomId) return [];
    
    const blockedRanges = getRoomBlockedRanges(roomId);
    const disabledDates = [];
    
    blockedRanges.forEach(range => {
        const startDate = new Date(range.start);
        const endDate = new Date(range.end);
        
        // Agregar todos los días entre start y end (inclusive)
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = formatDateForInput(currentDate.toISOString());
            disabledDates.push(dateStr);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });
    
    return disabledDates;
}

// Función para actualizar los date pickers con fechas deshabilitadas
function updateDatePickerRestrictions() {
    const roomId = getSelectedRoomId();
    const disabledDates = getDisabledDatesForRoom(roomId);
    const today = getTodayInputValue();
    
    if (fpStart) {
        fpStart.set('disable', disabledDates);
        fpStart.set('minDate', today);
    }
    
    if (fpEnd) {
        fpEnd.set('disable', disabledDates);
        fpEnd.set('minDate', today);
    }
}

// Cargar habitaciones
async function cargarHabitaciones() {
    const response = await fetch('/api/habitaciones');
    habitacionesData = await response.json();
    const select = document.getElementById('IDHabitacion');
    habitacionesData.forEach(h => {
        const option = document.createElement('option');
        option.value = h.IDHabitacion;
        option.textContent = `${h.NombreHabitacion} - $${h.Costo.toLocaleString()}`;
        option.dataset.costo = h.Costo;
        select.appendChild(option);
    });
}

// Cargar paquetes
async function cargarPaquetes(selectedRoomId = null) {
    const response = await fetch('/api/paquetes');
    paquetesData = await response.json();
    populatePaquetes(selectedRoomId);
}

function populatePaquetes(selectedRoomId = null, isDisabled = false) {
    const select = document.getElementById('IDPaquete');
    select.innerHTML = '<option value="">Seleccione un paquete</option>';

    const filteredPaquetes = selectedRoomId
        ? paquetesData.filter(p => String(p.IDHabitacion) === String(selectedRoomId))
        : paquetesData;

    filteredPaquetes.forEach(p => {
        const option = document.createElement('option');
        option.value = p.IDPaquete;
        option.textContent = `${p.NombrePaquete} - $${p.Precio.toLocaleString()}`;
        option.dataset.precio = p.Precio;
        option.disabled = isDisabled;
        select.appendChild(option);
    });

    if (selectedRoomId && filteredPaquetes.length === 0) {
        select.innerHTML += '<option value="">No hay paquetes disponibles para esta habitación</option>';
    }

    select.disabled = isDisabled;
}

function populateHabitacionesDisabled() {
    const select = document.getElementById('IDHabitacion');
    
    habitacionesData.forEach(h => {
        const option = document.createElement('option');
        option.value = h.IDHabitacion;
        option.textContent = `${h.NombreHabitacion} - $${h.Costo.toLocaleString()}`;
        option.dataset.costo = h.Costo;
        option.disabled = true;
        select.appendChild(option);
    });
    
    select.disabled = true;
}

function updateSelectStates() {
    const habitacionSelect = document.getElementById('IDHabitacion');
    const paqueteSelect = document.getElementById('IDPaquete');
    
    const habitacionSelected = habitacionSelect.value !== '';
    const paqueteSelected = paqueteSelect.value !== '';
    
    // Si hay habitación seleccionada, deshabilitar paquete
    if (habitacionSelected) {
        populatePaquetes(habitacionSelect.value, true);
    } else if (paqueteSelected) {
        // Si hay paquete seleccionado, deshabilitar habitación
        habitacionSelect.disabled = true;
        const options = habitacionSelect.querySelectorAll('option:not([value=""])');
        options.forEach(opt => opt.disabled = true);
    } else {
        // Si no hay nada seleccionado, habilitar todo
        habitacionSelect.disabled = false;
        const habitacionOptions = habitacionSelect.querySelectorAll('option:not([value=""])');
        habitacionOptions.forEach(opt => opt.disabled = false);
        
        paqueteSelect.disabled = false;
        const paqueteOptions = paqueteSelect.querySelectorAll('option:not([value=""])');
        paqueteOptions.forEach(opt => opt.disabled = false);
    }
}

// Cargar servicios
async function cargarServicios() {
    const response = await fetch('/api/servicios');
    const servicios = await response.json();
    serviciosData = servicios;
    const container = document.getElementById('serviciosContainer');
    container.innerHTML = '';

    servicios.forEach(s => {
        const div = document.createElement('div');
        div.className = 'servicio-item';
        div.dataset.servicioId = s.IDServicio;
        div.innerHTML = `
            <label class="servicio-label">
                <div class="servicio-control">
                    <input type="checkbox" class="servicio-check" value="${s.IDServicio}" data-costo="${s.Costo}">
                </div>
                <div class="servicio-main">
                    <div class="servicio-header">
                        <span class="servicio-name">${s.NombreServicio}</span>
                        <span class="servicio-price">$${s.Costo.toLocaleString()}</span>
                    </div>
                    <span class="servicio-summary">${s.Descripcion || 'Servicio premium para mejorar tu experiencia.'}</span>
                </div>
            </label>
            <div class="servicio-details">
                <p>${s.Descripcion || 'Servicio premium para mejorar tu experiencia.'}</p>
                <div class="servicio-meta">
                    ${s.Duracion ? `<span>Duración: ${s.Duracion}</span>` : ''}
                    ${s.MaxPersonas ? `<span>Máx. personas: ${s.MaxPersonas}</span>` : ''}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function toggleServicioDetails(servicioId, isActive) {
    const item = document.querySelector(`.servicio-item[data-servicio-id="${servicioId}"]`);
    if (!item) return;
    item.classList.toggle('active', isActive);
}

// Cargar métodos de pago
async function cargarMetodosPago() {
    const response = await fetch('/api/metodopago');
    const metodos = await response.json();
    const select = document.getElementById('MetodoPago');
    metodos.forEach(m => {
        const option = document.createElement('option');
        option.value = m.IdMetodoPago;
        option.textContent = m.NomMetodoPago;
        select.appendChild(option);
    });
}

async function cargarAllReservations() {
    const response = await fetch('/api/reservations');
    if (!response.ok) {
        allReservations = [];
        return;
    }
    allReservations = await response.json();
}

function getTodayInputValue() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTomorrowInputValue() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForInput(value) {
    if (!value) return '';
    return value.split('T')[0];
}

function getSelectedRoomId() {
    // Obtiene el ID de habitación seleccionado, ya sea directamente o a través de un paquete
    const habitacionSelect = document.getElementById('IDHabitacion');
    const paqueteSelect = document.getElementById('IDPaquete');
    
    if (habitacionSelect.value !== '') {
        return habitacionSelect.value;
    }
    
    if (paqueteSelect.value !== '') {
        const paquete = paquetesData.find(p => String(p.IDPaquete) === String(paqueteSelect.value));
        return paquete ? paquete.IDHabitacion : null;
    }
    
    return null;
}

function getRoomBlockedRanges(roomId) {
    if (!roomId) return [];
    return allReservations
        .filter(r => String(r.IDHabitacion) === String(roomId) && r.FechaInicio && r.FechaFinalizacion)
        .map(r => ({
            start: formatDateForInput(r.FechaInicio),
            end: formatDateForInput(r.FechaFinalizacion)
        }));
}

function isRangeOverlapping(start, end, range) {
    return !(end < range.start || start > range.end);
}

function updateDateLimits() {
    const today = getTodayInputValue();
    const startInput = document.getElementById('FechaInicio');
    const endInput = document.getElementById('FechaFinalizacion');
    startInput.min = today;
    endInput.min = today;
}

function updateAvailabilityMessage() {
    const roomId = getSelectedRoomId();
    const messageEl = document.getElementById('dateAvailabilityMessage');
    const blockedRanges = getRoomBlockedRanges(roomId);

    if (!roomId) {
        messageEl.textContent = 'Selecciona una habitación o paquete para ver las fechas ocupadas.';
        return;
    }

    if (blockedRanges.length === 0) {
        messageEl.textContent = 'La habitación está libre excepto en fechas anteriores a hoy.';
        return;
    }

    messageEl.innerHTML = `Fechas ocupadas para esta habitación: ${blockedRanges.map(r => `${r.start} a ${r.end}`).join('; ')}`;
}

function validateDateSelection() {
    const roomId = getSelectedRoomId();
    const startInput = document.getElementById('FechaInicio');
    const endInput = document.getElementById('FechaFinalizacion');
    const startValue = startInput.value;
    const endValue = endInput.value;
    const today = getTodayInputValue();
    const blockedRanges = getRoomBlockedRanges(roomId);

    let startError = '';
    let endError = '';

    if (startValue && startValue < today) {
        startError = 'La fecha de inicio no puede ser anterior a hoy.';
    }

    if (endValue && endValue < today) {
        endError = 'La fecha de finalización no puede ser anterior a hoy.';
    }

    if (startValue && endValue && endValue < startValue) {
        endError = 'La fecha de finalización debe ser igual o posterior a la fecha de inicio.';
    }

    if (roomId && startValue) {
        const startConflict = blockedRanges.some(range => isRangeOverlapping(startValue, startValue, range));
        if (startConflict) {
            startError = 'La fecha de inicio está ocupada para esta habitación.';
        }
    }

    if (roomId && endValue) {
        const endConflict = blockedRanges.some(range => isRangeOverlapping(endValue, endValue, range));
        if (endConflict) {
            endError = 'La fecha de finalización está ocupada para esta habitación.';
        }
    }

    if (roomId && startValue && endValue) {
        const rangeConflict = blockedRanges.some(range => isRangeOverlapping(startValue, endValue, range));
        if (rangeConflict) {
            startError = 'El rango de fechas seleccionado no está disponible para esta habitación.';
            endError = 'El rango de fechas seleccionado no está disponible para esta habitación.';
        }
    }

    startInput.setCustomValidity(startError);
    endInput.setCustomValidity(endError);
    startInput.reportValidity();
    endInput.reportValidity();

    return !startInput.validationMessage && !endInput.validationMessage;
}

// Mostrar detalle habitacion
function mostrarDetalleHabitacion(id) {
    const card = document.getElementById('detalleHabitacion');
    if (!id) { card.style.display = 'none'; return; }

    const h = habitacionesData.find(h => h.IDHabitacion == id);
    if (!h) return;

    const iconos = {
        'Cabaña Simple':   ['🌲 Vista al bosque', '🛏️ Cama individual', '🪵 Decoración rústica', '👤 Ideal para 1 persona'],
        'Cabaña Doble':    ['🌹 Ambiente romántico', '🛏️ Cama doble', '🪵 Decoración rústica', '👥 Ideal para 2 personas'],
        'Cabaña Familiar': ['🌿 Rodeada de naturaleza', '🛏️ Múltiples camas', '🪵 Amplio espacio', '👨‍👩‍👧‍👦 Hasta 4 personas'],
        'Domo Glamping':   ['⭐ Duerme bajo las estrellas', '🔭 Techo transparente', '🛏️ Cama queen', '💫 Experiencia única'],
        'Tienda de Lujo':  ['🏔️ Vista panorámica', '👑 Cama king size', '✨ Acabados de lujo', '🌄 Amanecer espectacular']
    };

    const detalles = iconos[h.NombreHabitacion] || ['🏠 Alojamiento confortable', '🌿 Contacto con la naturaleza'];

    card.innerHTML = `
        <h4>${h.NombreHabitacion}</h4>
        <p>${h.Descripcion}</p>
        ${detalles.map(d => `<p><span class="icon">✓</span> ${d}</p>`).join('')}
        <span class="precio-tag">$${h.Costo.toLocaleString()} / noche</span>
    `;
    card.style.display = 'block';
}

// Mostrar detalle paquete
function mostrarDetallePaquete(id) {
    const card = document.getElementById('detallePaquete');
    if (!id) { card.style.display = 'none'; return; }

    const p = paquetesData.find(p => p.IDPaquete == id);
    if (!p) return;

    const incluidos = {
        'Paquete Romántico':  ['🛁 Jacuzzi privado', '💆 Masaje relajante', '🍾 Decoración especial', '🌹 Detalles románticos'],
        'Paquete Aventura':   ['🐴 Cabalgata guiada', '🥾 Caminata ecológica', '🗺️ Guía experto', '🌿 Tour por la naturaleza'],
        'Paquete Familiar':   ['🍳 Desayuno campestre', '🔥 Fogata nocturna', '🎮 Actividades grupales', '👨‍👩‍👧‍👦 Espacio para todos'],
        'Paquete Estrellas':  ['🔥 Fogata nocturna', '🍳 Desayuno incluido', '⭐ Observación de estrellas', '🌙 Experiencia nocturna'],
        'Paquete Relax':      ['💆 Masaje completo', '🛁 Jacuzzi privado', '🧘 Zona de spa', '🌿 Desconexión total']
    };

    const items = incluidos[p.NombrePaquete] || ['✨ Experiencia glamping', '🌿 Contacto con naturaleza'];

    card.innerHTML = `
        <h4>${p.NombrePaquete}</h4>
        <p>${p.Descripcion}</p>
        <p style="color:var(--turquesa); font-size:0.82rem; margin-bottom:0.5rem;">INCLUYE:</p>
        ${items.map(i => `<p><span class="icon">✓</span> ${i}</p>`).join('')}
        <p><span class="icon">✓</span> 🏠 ${p.NombreHabitacion}</p>
        <p><span class="icon">✓</span> 🛎️ ${p.NombreServicio}</p>
        <span class="precio-tag">$${p.Precio.toLocaleString()}</span>
    `;
    card.style.display = 'block';
}

// Calcular total
function calcularTotal() {
    const selectPaquete = document.getElementById('IDPaquete');
    const precioPaquete = parseFloat(selectPaquete.selectedOptions[0]?.dataset.precio || 0);

    const selectHabitacion = document.getElementById('IDHabitacion');
    const costoHabitacion = parseFloat(selectHabitacion.selectedOptions[0]?.dataset.costo || 0);

    const serviciosSeleccionados = document.querySelectorAll('.servicio-check:checked');
    const totalServicios = Array.from(serviciosSeleccionados).reduce((sum, s) => sum + parseFloat(s.dataset.costo), 0);

    const subtotal = precioPaquete + costoHabitacion + totalServicios;
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    document.getElementById('subtotal').textContent = `$${subtotal.toLocaleString()}`;
    document.getElementById('iva').textContent = `$${iva.toLocaleString()}`;
    document.getElementById('total').textContent = `$${total.toLocaleString()}`;
}

// Eventos
const habitacionInput = document.getElementById('IDHabitacion');
const paqueteInput = document.getElementById('IDPaquete');
const fechaInicioInput = document.getElementById('FechaInicio');
const fechaFinalizacionInput = document.getElementById('FechaFinalizacion');

habitacionInput.addEventListener('change', (e) => {
    if (e.target.value !== '') {
        // Si selecciona habitación, resetear paquete y deshabilitarlo
        paqueteInput.value = '';
        mostrarDetallePaquete('');
    }
    mostrarDetalleHabitacion(e.target.value);
    populatePaquetes(e.target.value);
    calcularTotal();
    updateAvailabilityMessage();
    validateDateSelection();
    updateSelectStates();
    updateDatePickerRestrictions();
});

paqueteInput.addEventListener('change', (e) => {
    if (e.target.value !== '') {
        // Si selecciona paquete, resetear habitación y deshabilitarla
        habitacionInput.value = '';
        mostrarDetalleHabitacion('');
    }
    mostrarDetallePaquete(e.target.value);
    calcularTotal();
    updateAvailabilityMessage();
    validateDateSelection();
    updateSelectStates();
    updateDatePickerRestrictions();
});

fechaInicioInput.addEventListener('change', () => {
    fechaFinalizacionInput.min = fechaInicioInput.value || getTodayInputValue();
    updateAvailabilityMessage();
    validateDateSelection();
});

fechaFinalizacionInput.addEventListener('change', () => {
    validateDateSelection();
});

document.addEventListener('change', (e) => {
    if (e.target.classList.contains('servicio-check')) {
        toggleServicioDetails(e.target.value, e.target.checked);
        calcularTotal();
    }
});

// Enviar formulario
document.getElementById('reservationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateDateSelection()) {
        return;
    }

    const serviciosSeleccionados = Array.from(document.querySelectorAll('.servicio-check:checked')).map(s => parseInt(s.value));

    const data = {
        IDHabitacion: parseInt(document.getElementById('IDHabitacion').value),
        IDPaquete: parseInt(document.getElementById('IDPaquete').value),
        serviciosAdicionales: serviciosSeleccionados,
        FechaInicio: document.getElementById('FechaInicio').value,
        FechaFinalizacion: document.getElementById('FechaFinalizacion').value,
        MetodoPago: parseInt(document.getElementById('MetodoPago').value),
        UsuarioIdusuario: user.IDUsuario
    };

    try {
        const response = await fetch('/api/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Reserva creada exitosamente');
            window.location.href = '/page/reservas.html';
        } else {
            const error = await response.json();
            alert(error.message || 'Error al crear la reserva');
        }
    } catch (error) {
        alert('Error de conexión');
    }
});

// Inicializar
(async function initializePage() {
    await Promise.all([cargarHabitaciones(), cargarPaquetes(), cargarServicios(), cargarMetodosPago(), cargarAllReservations()]);
    updateDateLimits();
    updateAvailabilityMessage();
    updateSelectStates();
    
    // Establecer fechas por defecto
    const today = getTodayInputValue();
    const tomorrow = getTomorrowInputValue();
    document.getElementById('FechaInicio').value = today;
    document.getElementById('FechaFinalizacion').value = tomorrow;
    
    // Inicializar Flatpickr para la fecha de inicio
    fpStart = flatpickr('#FechaInicio', {
        minDate: getTodayInputValue(),
        disable: [],
        dateFormat: 'Y-m-d',
        defaultDate: today,
        onChange: function(selectedDates) {
            if (selectedDates.length > 0) {
                const startDate = selectedDates[0];
                const startDateStr = formatDateForInput(startDate.toISOString());
                if (fpEnd) {
                    fpEnd.set('minDate', startDateStr);
                }
                validateDateSelection();
            }
        }
    });
    
    // Inicializar Flatpickr para la fecha de finalización
    fpEnd = flatpickr('#FechaFinalizacion', {
        minDate: getTodayInputValue(),
        disable: [],
        dateFormat: 'Y-m-d',
        defaultDate: tomorrow,
        onChange: function() {
            validateDateSelection();
        }
    });
    
    // Calcular total con fechas por defecto
    calcularTotal();
})();