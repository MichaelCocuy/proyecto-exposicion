---
name: qa-plan-bugs
description: Arma el plan para desactivar la bomba antes de tocar código. Lee los 6 tickets en la tienda, reproduce cada bug en el navegador con el Playwright MCP, ubica el archivo de app/src donde vive, clasifica cada bug (claro, ambiguo o intermitente) y hace una sola ronda de preguntas al desarrollador con todas las dudas. Úsala al empezar la partida, antes de escribir pruebas.
---

Produces un **plan**, no código. Es el primer paso del agente `qa-playwright` y debería tomar unos 2 minutos. No edites `app/src` ni escribas pruebas durante esta skill.

## Pasos

1. **Lee los tickets.** Abre `http://localhost:3000/` con el navegador de Playwright (`browser_navigate` + `browser_snapshot`). Cada módulo tiene un ticket, la queja de un cliente citada textualmente. Esa es la descripción del bug, tal como llega en la vida real: incompleta.

2. **Reproduce cada bug en el navegador**, con el MCP (`browser_type`, `browser_click`, `browser_snapshot`). Haz lo que dice el ticket y anota el ❌ exacto (el valor, el mensaje). Un bug que no reproduces no está entendido. Si uno no se reproduce con clics sueltos, no insistas: probablemente depende del tiempo. Márcalo como intermitente y sigue.

3. **Ubica el código.** Lee el `app/src/<modulo>.js` del módulo: la lógica y los bugs están ahí. **No abras `juez/`.**

4. **Clasifica cada bug:**
   - **Claro**: el ticket y el sentido común dicen cuál es el comportamiento correcto.
   - **Ambiguo**: hay más de una forma razonable de arreglarlo y la decisión es de negocio, no técnica (por ejemplo, cómo se combinan descuento e impuesto, o qué cuenta como "coincidencia" en una búsqueda). **Estos se preguntan.**
   - **Intermitente**: no pasa siempre. Va al final, con `qa-triage-flaky`, que lo fuerza con `page.route`.

5. **Pregunta una sola vez.** Junta todas las dudas de los bugs ambiguos en **una** llamada a `AskUserQuestion` (hasta 4 preguntas). Cada pregunta debe:
   - nombrar el módulo y el caso concreto ("Con subtotal $50.000 y cupón CAFE10K, ¿el total es $47.600 o $49.500?");
   - traer opciones con el resultado numérico o de pantalla de cada una, para que el desarrollador conteste con un clic;
   - incluir los casos borde que cambian el arreglo (valores negativos, texto vacío, espacios).

6. **Entrega el plan** como tabla:

| # | Módulo | Qué se ve (reproducido) | Qué debería pasar | Tipo | Archivo | Prueba |
|---|---|---|---|---|---|---|
| 1 | Ingreso | … | … | claro | `app/src/login.js` | `tests/bugs/login.spec.ts` |

Debajo de la tabla, anota las respuestas del desarrollador tal cual. Son requisitos: el arreglo (`qa-arreglar-con-mcp`) y la prueba del final (`qa-escribir-spec`) deben seguirlas.

## Qué evitar

- Leer `juez/` para "confirmar" el comportamiento esperado.
- Resolver tú una ambigüedad de negocio.
- Hacer una ronda de preguntas por bug. El reloj corre.
- Planear sin reproducir: la tabla debe decir lo que **viste**, no lo que supones.
