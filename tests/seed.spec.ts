import { test, expect } from '@playwright/test';

// Prueba semilla: deja al agente parado dentro de la hacienda, listo para investigar.
// El número de caso se toma de la variable CASO (por defecto 4821).
const CASO = process.env.CASO ?? '4821';

test('entrar a la hacienda', async ({ page }) => {
  await page.goto(`/?caso=${CASO}&jugador=agente`);
  const placa = await page.locator('#placa-asignada').innerText();
  await page.getByLabel('Nombre del detective').fill('Agente Playwright');
  await page.getByLabel('Número de placa').fill(placa);
  await page.getByRole('button', { name: 'Entrar a la hacienda' }).click();
  await expect(page.getByRole('heading', { name: 'Expediente' })).toBeVisible();
});
