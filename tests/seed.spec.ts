import { test, expect } from '@playwright/test';

// Prueba semilla: abre la tienda y confirma que los 6 módulos (los 6 cables de la bomba) están en pantalla.
const MODULOS = ['Ingreso', 'Carrito', 'Pedidos', 'Envíos', 'Pago con cupón', 'Notas del pedido'];

test('la tienda carga los 6 módulos', async ({ page }) => {
  await page.goto('/');
  for (const modulo of MODULOS) {
    await expect(page.getByRole('heading', { name: modulo })).toBeVisible();
  }
});
