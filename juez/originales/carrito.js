// Calcula el total del carrito en dólares, con dos decimales.
export function calcularTotal(items) {
  const total = items.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
  return Math.floor(total * 100) / 100;
}
