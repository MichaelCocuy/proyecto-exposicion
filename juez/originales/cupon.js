// Total a pagar en pesos, con IVA y el cupón aplicado si es válido.
const IVA = 0.19;
const CUPONES = { CAFE10K: 10000 };

export function calcularTotalConCupon(subtotal, cupon) {
  const descuento = CUPONES[cupon] ?? 0;
  const base = subtotal - descuento;
  const total = base * (1 + IVA) - descuento;
  return Math.round(total);
}
