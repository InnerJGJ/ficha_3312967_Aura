// Reglas de negocio configurables — ajustar aquí (o vía variables de entorno)
// sin tocar la lógica de los servicios que las usan.

module.exports = {
  // Regla 3: horas que tiene el cliente para enviar el comprobante de pago
  // (vía WhatsApp al admin) antes de que una reserva Pendiente se cancele
  // automáticamente y libere el alojamiento/fechas reservadas.
  // Configurable por variable de entorno RESERVA_EXPIRACION_HORAS (Railway/--env).
  HORAS_EXPIRACION_RESERVA: Number(process.env.RESERVA_EXPIRACION_HORAS) || 1,
};
