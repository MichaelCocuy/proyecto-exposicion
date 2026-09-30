---
name: qa-triage-flaky
description: Diagnostica una prueba Playwright que falla solo a veces. La repite en aislamiento, compara las trazas de una corrida que pasa y una que falla, y decide si el problema está en la prueba o si es un bug real de la app (una carrera). Si es de la app, la vuelve determinista con page.route antes de arreglar. Úsala cuando una prueba de la bomba (típicamente Notas del pedido) da resultados distintos entre corridas.
---

Clasifica con evidencia antes de tocar nada. Una prueba intermitente es una señal: o la prueba está mal escrita o la app tiene una carrera que también sufren los usuarios. En la bomba, subir `retries` para que "pase" no corta ningún cable.

## Pasos

1. **Aísla la prueba.** Córrela sola, muchas veces:
   ```bash
   npx playwright test tests/bugs/notas.spec.ts --repeat-each=10 --trace=retain-on-failure
   ```
   Anota cuántas pasan y cuántas fallan.

2. **Clasifica según el patrón:**
   - **Falla 10 de 10**: no es intermitente. Es un bug determinista o una prueba mal escrita; vuelve a `qa-escribir-spec`.
   - **Pasa 10 de 10 después de un fallo**: ruido puntual. No lo declares resuelto con una muestra; repite más adelante.
   - **Mezcla de verdes y rojos**: intermitencia real. Abre la traza de una corrida roja (`npx playwright show-trace <ruta>`) y compárala con una verde. Mira el orden de las respuestas de red y lo que muestra la pantalla al final.

3. **Decide la causa:**
   - **La prueba no espera lo correcto** (falta un `await`, verifica antes de que llegue la respuesta): se arregla en la prueba, esperando el estado final con `expect(...).toHaveText()`.
   - **La app muestra un resultado viejo cuando las respuestas llegan desordenadas**: es un **bug de la app** (una carrera), y un usuario real también lo ve. No se tapa: se reproduce y se arregla.

4. **Si es de la app, hazla determinista.** Con `page.route('**/api/guardar', ...)` controla la demora de cada respuesta para forzar el orden que dispara el bug (la primera lenta, la segunda rápida). Ahora la prueba debe fallar **10 de 10**. Así queda demostrado que el bug es real y no ruido. Después arregla `app/src/notas.js` y confirma **10 de 10 en verde** con `--repeat-each=10`.

5. **Entrega el diagnóstico** en una tabla: prueba | corridas (verde/rojo) antes | causa | cómo se hizo determinista | corridas después del arreglo.

## Qué evitar

- Declarar "intermitente" con una sola repetición.
- `retries`, `test.skip`, `test.fixme` o timeouts más largos para que pase.
- `waitForTimeout` para "darle tiempo" al servidor.
- Correr toda la suite para diagnosticar una sola prueba.
