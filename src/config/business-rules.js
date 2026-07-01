// Reglas de negocio configurables — ajustar aquí (o vía variables de entorno)
// sin tocar la lógica de los servicios que las usan.

module.exports = {
  // Regla 3: horas que tiene el cliente para enviar el comprobante de pago
  // (vía WhatsApp al admin) antes de que una reserva Pendiente se cancele
  // automáticamente y libere el alojamiento/fechas reservadas.
  // Configurable por variable de entorno RESERVA_EXPIRACION_HORAS (Railway/--env).
  HORAS_EXPIRACION_RESERVA: Number(process.env.RESERVA_EXPIRACION_HORAS) || 1,

  // Recargo por persona extra en alojamientos.
  // precio_noche = precio_base + (personas_extra x precio_base x PORCENTAJE_PERSONA_EXTRA)
  // Env: PORCENTAJE_PERSONA_EXTRA (ej: 0.40 para 40%)
  PORCENTAJE_PERSONA_EXTRA: Number(process.env.PORCENTAJE_PERSONA_EXTRA) || 0.40,

  // Personas incluidas en el precio base de cualquier alojamiento/paquete.
  // El recargo empieza a partir de la persona numero (OCUPACION_ESTANDAR + 1).
  // Env: OCUPACION_ESTANDAR_PERSONAS
  OCUPACION_ESTANDAR_PERSONAS: Number(process.env.OCUPACION_ESTANDAR_PERSONAS) || 2,
};
