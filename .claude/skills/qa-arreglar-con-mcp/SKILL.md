---
name: qa-arreglar-con-mcp
description: Arregla un bug de la bomba y lo demuestra en el navegador con el Playwright MCP. Muestra el ❌ en la tienda, guarda el arreglo de app/src/<modulo>.js de una sola vez, recarga, repite los pasos del ticket, muestra el ✅ y confirma que el cable se cortó sin reconectar otros. Úsala por cada módulo después de qa-plan-bugs, con las respuestas del desarrollador en la mano.
---

Es el ciclo central de la demo, y el público lo ve en el navegador: **❌ en pantalla → arreglo → ✅ en pantalla → cable cortado**. Todo lo que pasa en la tienda se hace con el Playwright MCP, no con specs.

## Prerrequisito

Necesitas la tabla de `qa-plan-bugs`, con el ❌ que reprodujiste y las respuestas del desarrollador si el bug era ambiguo. Si falta una respuesta, pregunta antes de tocar el código.

## Pasos (por módulo)

1. **Muestra el ❌.** Con el MCP, en `http://localhost:3000/`, repite los pasos del ticket (`browser_type`, `browser_click`) y lee el resultado con `browser_snapshot`. Di en una línea qué se ve y qué debería verse.

2. **Piensa el arreglo completo antes de guardar.** Lee `app/src/<modulo>.js` y decide el cambio mínimo que:
   - resuelve lo que dice el ticket **y** lo que respondió el desarrollador;
   - cubre los casos borde del mismo tipo (mayúsculas, espacios, vacío, valores límite, resultados negativos);
   - conserva la firma y el tipo de retorno de la función, porque la interfaz y el juez la llaman tal cual (si devolvía un número, sigue devolviendo un número).

3. **Guarda una sola vez**, con `Write` del archivo completo. Nada de ediciones en varios pasos: cada guardado se evalúa, y un estado intermedio puede costar un strike.

4. **Muestra el ✅.** Recarga la tienda en el MCP (`browser_navigate` a la misma URL), repite los mismos pasos y lee el resultado. Después prueba **dos o tres casos más** del mismo módulo en el navegador: los casos borde del paso 2. Anota todos los pasos y resultados, porque `qa-escribir-spec` los va a convertir en pruebas.

5. **Confirma el cable.** `curl -s localhost:3000/api/estado`:
   - `desactivado`: cable cortado. Dilo y pasa al siguiente módulo.
   - `parcial`: va bien, pero falta algo que espera el negocio. Pregunta al desarrollador y vuelve al paso 2.
   - `activo`, con ✅ en el navegador: tu arreglo cubre el ticket pero no todos los casos. Prueba más casos en el MCP hasta encontrar el que falla y vuelve al paso 2.
   - `error`: el archivo no carga (error de sintaxis). Corrígelo de inmediato.
   - Revisa también que **ningún otro cable** haya vuelto a `activo`.

## Qué evitar

- Arreglar sin haber mostrado el ❌.
- Arreglar en `app/app.js` o `index.html`: la pantalla mejora, pero el cable no se corta.
- Cambiar lo que devuelve la función (por ejemplo, un número por texto con `toFixed`).
- Guardar varias veces el mismo archivo por un arreglo.
- Leer `juez/`.
