// Valida el correo que el cliente escribe en el formulario de ingreso.
const PATRON_CORREO = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export function validarCorreo(correo) {
  return PATRON_CORREO.test(correo);
}
