const db = require('./db');

const addColumnIfMissing = async (table, column, definition) => {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (rows.length === 0) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`[migration] + ${table}.${column}`);
  }
};

const runMigrations = async () => {
  try {
    // Regla 3: marca de expiración en reservas pendientes (ver HORAS_EXPIRACION_RESERVA en config/business-rules.js)
    await addColumnIfMissing('reserva', 'FechaExpiracion', 'DATETIME NULL');

    // Regla 10: verificación de email para permitir reservas
    await addColumnIfMissing('usuarios', 'EmailVerificado', 'TINYINT(1) NOT NULL DEFAULT 1');

    // Recordatorio de check-in: evita reenviar el correo en cada corrida del cron
    await addColumnIfMissing('reserva', 'RecordatorioEnviado', 'TINYINT(1) NOT NULL DEFAULT 0');

    // Cantidad de huéspedes para los que es la reserva
    await addColumnIfMissing('reserva', 'CantidadHuespedes', 'INT NOT NULL DEFAULT 1');

    // Regla 8: historial de cambios de estado en reservas
    await db.query(`
      CREATE TABLE IF NOT EXISTS reserva_historial (
        IDHistorial   INT AUTO_INCREMENT PRIMARY KEY,
        IdReserva     INT NOT NULL,
        EstadoAnterior TINYINT,
        EstadoNuevo   TINYINT NOT NULL,
        FechaCambio   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ModificadoPor VARCHAR(100),
        Motivo        TEXT,
        INDEX idx_rh_reserva (IdReserva)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('[migration] reserva_historial ready');

    // Nuevos usuarios deben verificar — los existentes ya tienen DEFAULT 1 (verificados)

    // Asignar alojamientos a paquetes que aún no tienen uno (idempotente)
    const paqAloj = [
      { id: 6, IDCabana: 3,    IDHabitacion: null }, // El Venado → Cabaña La Montaña
      { id: 7, IDCabana: 1,    IDHabitacion: null }, // Toro Mecánico → Cabaña Familiar Bosque Verde
      { id: 8, IDCabana: null, IDHabitacion: 6    }, // Paquete Viajero → Doble
    ];
    for (const p of paqAloj) {
      const [rows] = await db.query(
        'SELECT IDPaquete FROM paquetes WHERE IDPaquete = ? AND IDHabitacion IS NULL AND IDCabana IS NULL',
        [p.id]
      );
      if (rows.length > 0) {
        await db.query(
          'UPDATE paquetes SET IDHabitacion = ?, IDCabana = ? WHERE IDPaquete = ?',
          [p.IDHabitacion, p.IDCabana, p.id]
        );
        console.log(`[migration] paquete #${p.id} → alojamiento asignado`);
      }
    }

    console.log('[migration] all migrations OK');
  } catch (err) {
    console.error('[migration] Error:', err.message);
  }
};

module.exports = { runMigrations };
