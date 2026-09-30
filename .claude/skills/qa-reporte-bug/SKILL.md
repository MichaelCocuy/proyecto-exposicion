---
name: qa-reporte-bug
description: Escribe el informe de la partida en reportes/, con un reporte por bug (qué reportó el cliente, cómo se reprodujo, qué preguntó y respondió el desarrollador, causa raíz, arreglo, prueba de regresión y evidencia) y un resumen con el tiempo y los strikes de la bomba. Úsala al terminar la partida, o antes si un bug no se pudo arreglar y hay que dejarlo documentado para un humano.
---

Produce un **informe en markdown** en `reportes/desactivacion-<AAAA-MM-DD-HHMM>.md`. Es lo que el equipo muestra al final: la prueba de que el agente no solo "arregló cosas", sino que dejó cada bug documentado y cubierto por una prueba. No abras issues ni hagas commits: eso lo decide el equipo.

## Pasos

1. **Recoge el estado de la bomba**: `curl -s localhost:3000/api/estado` (fase, cables cortados, strikes, eventos con su minuto).

2. **Recoge la evidencia de cada módulo**:
   - la prueba (`tests/bugs/<modulo>.spec.ts`) y su resultado actual con `npx playwright test`;
   - el diff del arreglo: `git diff app/src/<modulo>.js`;
   - si hubo intermitencia, el diagnóstico de `qa-triage-flaky`.

3. **Escribe el informe con esta estructura:**

```markdown
# Informe de desactivación · <fecha>

**Resultado:** desactivada en MM:SS | explotó (tiempo / strikes) · **Cables:** N/6 · **Strikes:** N/3
**Pruebas:** N pasan / N fallan (`npx playwright test`)

## <#> · <Módulo>: <título en una línea: qué hacía vs. qué debía hacer>

- **Ticket:** “<cita del cliente>”
- **Reproducción (MCP):** pasos mínimos en la tienda, el ❌ observado antes del arreglo y el ✅ después.
- **Preguntas al desarrollador:** la pregunta y la respuesta tal cual. Si no fue necesario preguntar, "No fue necesario: <por qué el comportamiento era claro>".
- **Causa raíz:** la línea o la lógica exacta en `app/src/<modulo>.js` y por qué fallaba.
- **Arreglo:** qué cambió (resumen del diff).
- **Prueba de regresión:** `tests/bugs/<modulo>.spec.ts`, qué casos cubre, y el resultado de `qa-escribir-spec`: roja con el código original y verde con el arreglo.
- **Técnica de Playwright:** la que resolvió este caso (localizadores por rol, `page.route`, pruebas parametrizadas…).

## Lo que no se resolvió
Módulos con el cable conectado, o "Casi…": qué se intentó, qué falta y qué preguntaría un humano. Si no quedó nada, escribe "Nada: los 6 cables cortados".

## Línea de tiempo
Los eventos de la bomba (minuto y texto), tal como los devuelve `/api/estado`.
```

4. **No omitas secciones.** Si un bug no necesitó preguntas, dilo explícitamente. Si hubo strikes, explica qué los causó: es lo más instructivo para todos.

## Qué evitar

- Reportar un bug como arreglado sin la prueba en verde.
- Inventar la causa raíz: debe salir del código y del diff.
- Incluir contenido de `juez/`.
