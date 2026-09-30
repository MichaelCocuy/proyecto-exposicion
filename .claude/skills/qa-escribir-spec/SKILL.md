---
name: qa-escribir-spec
description: Convierte lo que el agente hizo en el Playwright MCP durante la partida en pruebas Playwright permanentes (tests/bugs/<modulo>.spec.ts), y demuestra que atrapan los bugs corriéndolas contra el código original (rojo) y contra los arreglos (verde). Úsala al final, con la bomba ya desactivada, para cerrar la demo mostrando que la exploración quedó automatizada.
---

La exploración con el MCP resolvió el problema **una vez**. Esta skill la vuelve **repetible**: cada paso que hiciste en el navegador se convierte en una prueba que cualquiera corre con `npx playwright test`. Es el cierre de la demo.

Úsala **con la bomba desactivada** (o explotada), porque con el reloj detenido cambiar `app/src` ya no cuenta strikes.

## Pasos

1. **Escribe una prueba por módulo** en `tests/bugs/<modulo>.spec.ts`, con los mismos pasos y casos que hiciste en el MCP (`qa-arreglar-con-mcp`, paso 4):
   - entra por la interfaz (`page.goto('/')`) y actúa dentro de la sección del módulo (`page.locator('#modulo-login')`) para no confundir botones de otros módulos;
   - usa los mismos localizadores que viste en el snapshot: `getByLabel('Correo')`, `getByRole('button', { name: 'Ingresar' })`, `getByRole('status')`;
   - comprueba el resultado con `expect(...).toHaveText()` o `toContainText()`, que esperan solas;
   - usa un `for` sobre la lista de casos cuando probaste varios;
   - lleva un comentario de una línea que cita el ticket.

   Para **Notas del pedido**, reutiliza el `page.route` que usaste en el MCP (ver `qa-triage-flaky`):
   ```ts
   // La primera respuesta llega tarde y la segunda rápido: el orden que dispara el bug.
   // fulfill (no continue) para que la demora aleatoria del servidor no meta ruido.
   let llamada = 0;
   let respondidas = 0;
   await page.route('**/api/guardar', async (route) => {
     const demora = llamada++ === 0 ? 800 : 50;
     await new Promise((r) => setTimeout(r, demora));
     await route.fulfill({ json: { texto: route.request().postData() } });
     respondidas++;
   });
   // … guardar dos veces …
   // Espera a que lleguen LAS DOS respuestas antes de verificar: si verificas apenas llega la rápida,
   // la prueba pasa aunque el bug siga (la respuesta vieja todavía no ha pisado a la nueva).
   await expect.poll(() => respondidas).toBe(2);
   await expect(modulo.getByRole('status')).toHaveText('Guardado: «versión 2»');
   ```

2. **Verde con los arreglos.** `npx playwright test`. Todas deben pasar. Si una falla, la prueba no refleja lo que hiciste en el MCP: corrígela (es la prueba, no la app).

3. **Rojo con los bugs originales.** Esto demuestra que las pruebas atrapan los bugs, no que pasan siempre:
   ```bash
   git stash push -- app/src        # guarda los arreglos y vuelve al código con bugs
   npx playwright test tests/bugs   # deben fallar todas
   git stash pop                    # recupera los arreglos
   npx playwright test              # todo verde otra vez
   ```
   Si una prueba **pasa** con el código original, no está probando el bug: ajústala hasta que falle.

4. **Muestra el resultado**: la tabla módulo | casos | rojo con bugs | verde con arreglos, y `npx playwright show-report` para el reporte HTML.

## Qué evitar

- Escribir specs durante los 10 minutos: el reloj es para arreglar.
- Pruebas que pasan también con el código original (sin aserción, o con el valor del bug).
- `waitForTimeout`, `retries` o timeouts largos para que algo pase.
- Importar `app/src` desde la prueba: se prueba por la interfaz, como un usuario.
- Olvidar el `git stash pop`: sin él, la tienda vuelve a tener los bugs.
