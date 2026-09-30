---
name: qa-escribir-spec
description: Escribe una prueba Playwright que falla por cada bug del plan (tests/bugs/<modulo>.spec.ts), confirma que falla por la razón correcta, arregla app/src/<modulo>.js y la vuelve a correr hasta verla en verde, sin romper los demás módulos. Úsala después de qa-plan-bugs, con las respuestas del desarrollador en la mano.
---

Aquí sí escribes código: pruebas en `tests/bugs/` y arreglos en `app/src/`. El ciclo es siempre **rojo → arreglo → verde**. Si no hay prueba roja, no hay arreglo.

## Prerrequisito

Necesitas la tabla de `qa-plan-bugs` y las respuestas del desarrollador a los bugs ambiguos. Si falta una respuesta, pregunta antes de escribir la prueba de ese módulo.

## Pasos

1. **Escribe las pruebas rojas, todas primero.** Una por módulo, en `tests/bugs/<modulo>.spec.ts`. Cada una:
   - entra por la interfaz (`page.goto('/')`) y actúa como el cliente del ticket;
   - usa localizadores accesibles: `getByLabel('Correo')`, `getByRole('button', { name: 'Ingresar' })`, `getByRole('status')`, dentro de la sección del módulo (`page.locator('#modulo-login')`) para no confundir botones de otros módulos;
   - comprueba el resultado **que pidió el negocio**, con `expect(...).toHaveText()` o `toContainText()`, que esperan solas;
   - cubre los casos borde que confirmó el desarrollador, con un `for` sobre una lista de casos cuando son varios;
   - lleva un comentario de una línea que cita el ticket.

   Para el módulo intermitente, **controla la red** para que la carrera ocurra siempre:
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

2. **Córrelas y confirma el rojo.** `npx playwright test tests/bugs`. Cada una debe fallar **por el bug** (el valor incorrecto que viste en el plan), no por un selector que no encuentra nada ni por un timeout. Si falla por otra cosa, arregla la prueba primero.

3. **Arregla un módulo a la vez**, en `app/src/<modulo>.js`:
   - cambia lo mínimo, sin tocar la firma de la función (la interfaz y el juez la usan tal cual);
   - guarda el archivo **una sola vez**, con el arreglo completo, porque cada guardado se evalúa;
   - corre la prueba del módulo: `npx playwright test tests/bugs/<modulo>.spec.ts`.

4. **Verde y sin regresiones.** Cuando la prueba pase, corre toda la suite (`npx playwright test`) antes de seguir con el siguiente módulo. Un cable cortado que se vuelve a conectar es un strike.

5. **Confirma el cable.** `curl -s localhost:3000/api/estado` muestra el estado de cada cable. Si tu prueba está en verde pero el cable dice "Casi…", tu prueba no cubre todo lo que espera el negocio: vuelve a preguntar al desarrollador y amplía la prueba antes de cambiar el arreglo.

## Qué evitar

- Escribir la prueba **después** del arreglo. Entonces no demuestra nada.
- Pruebas que siempre pasan (sin aserción, o con el valor que devuelve el código con bug).
- `waitForTimeout`, `retries` o timeouts largos para que algo pase.
- Importar `app/src` desde la prueba: se prueba por la interfaz, como un usuario.
- Leer `juez/`.
