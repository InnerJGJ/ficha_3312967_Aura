-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS hospedaje;
USE hospedaje;

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    IDUsuario INT AUTO_INCREMENT PRIMARY KEY,
    NombreUsuario VARCHAR(255) NOT NULL,
    Email VARCHAR(255),
    Password VARCHAR(255),
    Rol VARCHAR(50)
);

-- Tabla estadosreserva
CREATE TABLE IF NOT EXISTS estadosreserva (
    IdEstadoReserva INT AUTO_INCREMENT PRIMARY KEY,
    NombreEstadoReserva VARCHAR(255) NOT NULL
);

-- Tabla metodopago
CREATE TABLE IF NOT EXISTS metodopago (
    IdMetodoPago INT AUTO_INCREMENT PRIMARY KEY,
    NomMetodoPago VARCHAR(255) NOT NULL
);

-- Tabla habitacion
CREATE TABLE IF NOT EXISTS habitacion (
    IDHabitacion INT AUTO_INCREMENT PRIMARY KEY,
    NombreHabitacion VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2),
    descripcion TEXT,
    Estado INT DEFAULT 1,
    numero INT,
    imagen VARCHAR(255),
    Costo DECIMAL(10,2)
);

-- Tabla paquetes
CREATE TABLE IF NOT EXISTS paquetes (
    IDPaquete INT AUTO_INCREMENT PRIMARY KEY,
    NombrePaquete VARCHAR(255) NOT NULL,
    Precio DECIMAL(10,2),
    IDHabitacion INT,
    FOREIGN KEY (IDHabitacion) REFERENCES habitacion(IDHabitacion)
);

-- Tabla reserva
CREATE TABLE IF NOT EXISTS reserva (
    IdReserva INT AUTO_INCREMENT PRIMARY KEY,
    UsuarioIdusuario INT,
    IdEstadoReserva INT,
    MetodoPago INT,
    FechaReserva DATE,
    FechaInicio DATE,
    FechaFin DATE,
    Total DECIMAL(10,2),
    FOREIGN KEY (UsuarioIdusuario) REFERENCES usuarios(IDUsuario),
    FOREIGN KEY (IdEstadoReserva) REFERENCES estadosreserva(IdEstadoReserva),
    FOREIGN KEY (MetodoPago) REFERENCES metodopago(IdMetodoPago)
);

-- Tabla detallereservapaquetes
CREATE TABLE IF NOT EXISTS detallereservapaquetes (
    IDReserva INT,
    IDPaquete INT,
    PRIMARY KEY (IDReserva, IDPaquete),
    FOREIGN KEY (IDReserva) REFERENCES reserva(IdReserva),
    FOREIGN KEY (IDPaquete) REFERENCES paquetes(IDPaquete)
);

-- Tabla servicios
CREATE TABLE IF NOT EXISTS servicios (
    IDServicio INT AUTO_INCREMENT PRIMARY KEY,
    NombreServicio VARCHAR(255),
    nombre VARCHAR(255),
    precio DECIMAL(10,2),
    Descripcion TEXT,
    Estado INT DEFAULT 1,
    imagen VARCHAR(255),
    Costo DECIMAL(10,2)
);

-- Tabla detallereservaservicio
CREATE TABLE IF NOT EXISTS detallereservaservicio (
    IDReserva INT,
    IDServicio INT,
    PRIMARY KEY (IDReserva, IDServicio),
    FOREIGN KEY (IDReserva) REFERENCES reserva(IdReserva),
    FOREIGN KEY (IDServicio) REFERENCES servicios(IDServicio)
);

-- Insertar datos de ejemplo
INSERT INTO usuarios (NombreUsuario, Email, Password, Rol) VALUES
('Admin', 'admin@example.com', 'password', 'admin'),
('User1', 'user1@example.com', 'password', 'user');

INSERT INTO estadosreserva (NombreEstadoReserva) VALUES
('Pendiente'),
('Confirmada'),
('Cancelada');

INSERT INTO metodopago (NomMetodoPago) VALUES
('Efectivo'),
('Tarjeta'),
('Transferencia');

INSERT INTO habitacion (NombreHabitacion, precio, descripcion, Estado, numero, imagen, Costo) VALUES
('Habitación Simple', 50.00, 'Habitación básica', 1, 101, '', 50.00),
('Habitación Doble', 80.00, 'Habitación para dos', 1, 102, '', 80.00);

INSERT INTO paquetes (NombrePaquete, Precio, IDHabitacion) VALUES
('Paquete Básico', 100.00, 1),
('Paquete Premium', 150.00, 2);

INSERT INTO servicios (NombreServicio, nombre, precio, Descripcion, Estado, imagen, Costo) VALUES
('Desayuno', 'Desayuno', 10.00, 'Desayuno continental', 1, '', 10.00),
('Lavandería', 'Lavandería', 5.00, 'Servicio de lavandería', 1, '', 5.00);