// Verificar sesión y rol
const userData = localStorage.getItem('user');
if (!userData) window.location.href = '/src/pages/login.html';
const user = JSON.parse(userData);
if (user.IDRol !== 2) window.location.href = '/src/pages/reservas.html';

const adminName = document.getElementById('adminName');
const newItemBtn = document.getElementById('newItemBtn');
const searchInput = document.getElementById('searchInput');

if (adminName) {
    adminName.textContent = `Bienvenido, ${user.NombreUsuario}`;
}

// Cerrar sesión
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = '/src/pages/login.html';
    });
}

// Navegación
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.admin-section');
const titles = {
    reservas: 'Gestión de Reservas',
    habitaciones: 'Gestión de Habitaciones',
    usuarios: 'Gestión de Usuarios',
    clientes: 'Gestión de Clientes',
    paquetes: 'Gestión de Paquetes',
    servicios: 'Gestión de Servicios'
};

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        item.classList.add('active');
        const section = item.dataset.section;
        document.getElementById(`section-${section}`).classList.add('active');
        document.getElementById('sectionTitle').textContent = titles[section];
        updateHeader(section);
        cargarSeccion(section);
    });
});

function cargarSeccion(section) {
    switch(section) {
        case 'reservas': cargarReservas(); break;
        case 'habitaciones': cargarHabitaciones(); break;
        case 'usuarios': cargarUsuarios(); break;
        case 'clientes': cargarClientes(); break;
        case 'paquetes': cargarPaquetes(); break;
        case 'servicios': cargarServicios(); break;
    }
}

function updateHeader(section) {
    if (!newItemBtn) return;
    if (section === 'habitaciones') {
        newItemBtn.style.display = 'inline-flex';
        newItemBtn.textContent = '+ Nueva habitación';
    } else {
        newItemBtn.style.display = 'none';
    }
}

// RESERVAS
async function cargarReservas() {
    const response = await fetch('/api/reservations');
    const reservas = await response.json();
    const estadosRes = await fetch('/api/estadosreserva');
    const estados = await estadosRes.json();

    const list = document.getElementById('reservasList');
    if (reservas.length === 0) {
        list.innerHTML = '<p style="color:var(--gris)">No hay reservas registradas.</p>';
        return;
    }

    list.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Documento</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Total</th>
                    <th>Pago</th>
                    <th>Estado</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>
                ${reservas.map(r => `
                    <tr>
                        <td>#${r.IdReserva}</td>
                        <td>${r.NombreUsuario}</td>
                        <td>${r.NroDocumentoCliente}</td>
                        <td>${r.FechaInicio ? new Date(r.FechaInicio).toLocaleDateString() : '-'}</td>
                        <td>${r.FechaFinalizacion ? new Date(r.FechaFinalizacion).toLocaleDateString() : '-'}</td>
                        <td>$${r.MontoTotal?.toLocaleString()}</td>
                        <td>${r.NomMetodoPago}</td>
                        <td><span class="badge badge-${r.NombreEstadoReserva?.toLowerCase()}">${r.NombreEstadoReserva}</span></td>
                        <td>
                            <select class="estado-select" onchange="cambiarEstado(${r.IdReserva}, this.value)">
                                ${estados.map(e => `
                                    <option value="${e.IdEstadoReserva}" ${e.IdEstadoReserva === r.IdEstadoReserva ? 'selected' : ''}>
                                        ${e.NombreEstadoReserva}
                                    </option>
                                `).join('')}
                            </select>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function cambiarEstado(idReserva, idEstado) {
    try {
        const response = await fetch(`/api/reservations/${idReserva}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ IdEstadoReserva: idEstado })
        });
        if (response.ok) cargarReservas();
        else alert('Error al cambiar estado');
    } catch (error) {
        alert('Error de conexión');
    }
}

// HABITACIONES
async function cargarHabitaciones() {
    const response = await fetch('/api/habitaciones');
    const habitaciones = await response.json();
    const container = document.getElementById('habitacionesGrid');

    if (!container) return;
    if (habitaciones.length === 0) {
        container.innerHTML = '<p style="color:var(--gris)">No hay habitaciones registradas.</p>';
        return;
    }

    container.innerHTML = habitaciones.map(h => {
        const estado = h.Estado === 1 ? 'Disponible' : 'Mantenimiento';
        const estadoClass = h.Estado === 1 ? 'status-disponible' : 'status-mantenimiento';
        const precio = h.Precio ? `$${Number(h.Precio).toLocaleString()}` : '$0';
        return `
            <article class="room-card">
                <img src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80" alt="${h.NombreHabitacion || 'Habitación'}" />
                <div class="room-card-body">
                    <div>
                        <h3>${h.NombreHabitacion || 'Habitación'}</h3>
                        <p>${h.Descripcion || 'Descripción breve de la habitación.'}</p>
                    </div>
                    <div class="room-info">
                        <span class="room-price">${precio}</span>
                        <span class="badge-status ${estadoClass}">${estado}</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// USUARIOS
async function cargarUsuarios() {
    const response = await fetch('/api/usuarios');
    const usuarios = await response.json();
    const list = document.getElementById('usuariosList');

    list.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>País</th>
                    <th>Rol</th>
                </tr>
            </thead>
            <tbody>
                ${usuarios.map(u => `
                    <tr>
                        <td>${u.IDUsuario}</td>
                        <td>${u.NombreUsuario}</td>
                        <td>${u.Apellido || '-'}</td>
                        <td>${u.Email}</td>
                        <td>${u.Telefono || '-'}</td>
                        <td>${u.Pais || '-'}</td>
                        <td>${u.IDRol === 2 ? 'Admin' : 'Cliente'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// CLIENTES
async function cargarClientes() {
    const response = await fetch('/api/clientes');
    const clientes = await response.json();
    const list = document.getElementById('clientesList');

    list.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Documento</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Dirección</th>
                </tr>
            </thead>
            <tbody>
                ${clientes.map(c => `
                    <tr>
                        <td>${c.NroDocumento}</td>
                        <td>${c.Nombre}</td>
                        <td>${c.Apellido || '-'}</td>
                        <td>${c.Email}</td>
                        <td>${c.Telefono || '-'}</td>
                        <td>${c.Direccion || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// PAQUETES
async function cargarPaquetes() {
    const response = await fetch('/api/paquetes');
    const paquetes = await response.json();
    const list = document.getElementById('paquetesList');

    list.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Habitación</th>
                    <th>Servicio</th>
                    <th>Precio</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${paquetes.map(p => `
                    <tr>
                        <td>${p.IDPaquete}</td>
                        <td>${p.NombrePaquete}</td>
                        <td>${p.NombreHabitacion}</td>
                        <td>${p.NombreServicio}</td>
                        <td>$${p.Precio?.toLocaleString()}</td>
                        <td><span class="badge badge-confirmada">${p.Estado === 1 ? 'Activo' : 'Inactivo'}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// SERVICIOS
async function cargarServicios() {
    const response = await fetch('/api/servicios');
    const servicios = await response.json();
    const list = document.getElementById('serviciosList');

    list.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Duración</th>
                    <th>Max Personas</th>
                    <th>Costo</th>
                </tr>
            </thead>
            <tbody>
                ${servicios.map(s => `
                    <tr>
                        <td>${s.IDServicio}</td>
                        <td>${s.NombreServicio}</td>
                        <td>${s.Descripcion}</td>
                        <td>${s.Duracion}</td>
                        <td>${s.CantidadMaximaPersonas}</td>
                        <td>$${s.Costo?.toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Cargar sección inicial
updateHeader('reservas');
cargarReservas();