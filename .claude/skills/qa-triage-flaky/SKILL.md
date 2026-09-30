---
name: qa-triage-flaky
description: Diagnostica un bug que aparece solo a veces (en la bomba, Notas del pedido). Con el Playwright MCP lo reproduce varias veces, compara el orden de las respuestas de red, y cuando la causa es una carrera la fuerza con page.route para que el ❌ aparezca siempre, antes y después del arreglo. Úsala cuando un bug o una prueba da resultados distintos entre intentos.
---

Un bug intermitente no se arregla "a ver si pasa". Primero se vuelve **determinista**: si puedes hacer que falle siempre, entendiste la causa, y si después del arreglo nunca falla, está resuelto. Subir timeouts o repetir hasta que salga verde no corta ningún cable.

## Pasos

1. **Intenta reproducirlo como el usuario.** Con el MCP: escribe una nota, Guardar, cámbiala, Guardar. Vas a ver que casi siempre sale bien. Entre una llamada del MCP y la siguiente pasan segundos, y la primera respuesta ya volvió antes del segundo clic. Eso es información: el bug depende del **tiempo**.

2. **Mira la red.** `browser_network_requests` muestra las llamadas a `/api/guardar` y cuánto tardó cada una (el servidor responde con una demora aleatoria de 100 a 900 ms). Hipótesis: si la primera respuesta llega **después** de la segunda, la pantalla muestra la versión vieja.

3. **Fuerza la carrera con `page.route`.** Con `browser_run_code_unsafe` (pide confirmación a tu equipo; explica en una línea qué hace), guarda dos veces seguidas controlando la demora de cada respuesta:
   ```js
   async (page) => {
     // La primera respuesta llega tarde y la segunda rápido: el orden que dispara el bug.
     let llamada = 0, respondidas = 0;
     await page.route('**/api/guardar', async (route) => {
       const demora = llamada++ === 0 ? 800 : 50;
       await new Promise((r) => setTimeout(r, demora));
       await route.fulfill({ json: { texto: route.request().postData() } });
       respondidas++;
     });
     const modulo = page.locator('#modulo-notas');
     await modulo.getByLabel('Nota para el pedido').fill('versión 1');
     await modulo.getByRole('button', { name: 'Guardar' }).click();
     await modulo.getByLabel('Nota para el pedido').fill('versión 2');
     await modulo.getByRole('button', { name: 'Guardar' }).click();
     while (respondidas < 2) await new Promise((r) => setTimeout(r, 50));
     await page.unroute('**/api/guardar');
     return await modulo.getByRole('status').textContent();
   }
   ```
   Con el bug devuelve `Guardado: «versión 1»` **siempre**: se guardó la 2, pero la pantalla muestra la 1. Hipótesis confirmada. Esa es la carrera.

4. **Clasifica:**
   - **La app muestra un resultado viejo cuando las respuestas llegan desordenadas**: bug real de la app. Un usuario con mala conexión también lo ve. Se arregla en `app/src/notas.js` con `qa-arreglar-con-mcp`: la pantalla solo debe mostrar la respuesta del **último** guardado. No se arregla deshabilitando el botón en `app/app.js`.
   - **Una prueba que verifica antes de tiempo** (antes de que llegue la respuesta lenta): es un problema de la prueba. Se arregla esperando las dos respuestas antes de verificar, nunca con `waitForTimeout`.

5. **Verifica el arreglo con el mismo código del paso 3.** Ahora debe devolver `Guardado: «versión 2»`. Córrelo dos o tres veces: siempre igual. Guarda el snippet: `qa-escribir-spec` lo convierte en la prueba de Notas.

## Qué evitar

- Declarar el bug arreglado porque "ya no pasó" con clics sueltos: con clics sueltos tampoco pasaba antes.
- `waitForTimeout`, `retries` o timeouts más largos.
- Arreglar en la interfaz (deshabilitar el botón) en vez de en `app/src/notas.js`.
- Usar `browser_run_code_unsafe` para algo que no sea interactuar con la página.
