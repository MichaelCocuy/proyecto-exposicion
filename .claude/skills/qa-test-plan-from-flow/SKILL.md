---
name: qa-test-plan-from-flow
description: Genera un plan de pruebas Playwright a partir de un flow (docs/06-flows/EP-XXX-*.md) antes de escribir specs — mapea cada nodo/arco del diagrama a capa (UI/API), rol y project, y evita duplicar cobertura Cypress existente. Úsala cuando una épica del gateway queda implementada y hay que decidir qué testear antes de tocar código de test.
---

Produces un **plan de pruebas**, no código. El resultado es una tabla que el usuario aprueba antes de que el agente `qa-playwright` (u otro) escriba specs reales. No ejecutes tests ni levantes infraestructura durante esta skill — es solo lectura y análisis.

## Pasos

1. **Ubicar el flow.** Lee `docs/06-flows/EP-XXX-*.md` (busca por número de épica si el usuario solo dio el ID). Es la **fuente primaria**: no abras `docs/04-historias/HU-XXX.md` — el flow ya trae, en los comentarios `%% HU-XXX` sobre cada arco del mermaid, la trazabilidad que necesitas citar. Usa esos comentarios solo como referencia de trazabilidad, nunca como fuente de criterios de aceptación.

2. **Recorrer el diagrama.** Extrae del bloque ` ```mermaid ` la secuencia de nodos (pantallas/estados) y arcos (transiciones/acciones del usuario). Cada arco con un comentario `%% HU-XXX` encima es una unidad de comportamiento verificable — trátalo como el equivalente a un criterio de aceptación para efectos del plan. Presta atención a ramas de decisión (`{"...?"}`), bloqueos (`[/".../"/]`) y bucles (arcos que vuelven a un nodo anterior) — cada uno es un caso de prueba distinto.

3. **Revisar cobertura Cypress existente.** Busca en `gateway-src/src/test/javascript/cypress/e2e/` (symlink de solo lectura, ver `.claude/agents/qa-playwright.md`) specs que ya referencien esta EP-XXX (o el HU-XXX del arco) en su comentario o nombre de archivo. Cualquier arco ya cubierto ahí con calidad suficiente se marca "no duplicar" — Playwright solo debe sumar valor real (API+UI combinado en un mismo test, traces, un caso que Cypress no cubre).

4. **Revisar selectores disponibles.** Compara las pantallas/nodos involucrados contra `playwright/support/selectors.ts` (espejo manual) y el código real en `gateway-src` (`data-cy`/`data-testid`). Anota qué selectores ya existen y cuáles habría que copiar a mano antes de escribir el spec.

5. **Para cada arco del flow, decide:**
   - **Capa**: UI (`e2e`), API (`api`), o ambas.
   - **Rol/project**: revisa si el nodo/arco implica una authority específica → `chromium`/`api` (user) o `chromium-admin`/`api-admin` (admin). Si un arco depende de una authority que el usuario logueado no tiene, márcalo explícitamente (ver convención EP-004 sobre 403 enmascarados por admin).
   - **¿Duplica Cypress?** sí/no + justificación breve si Playwright aporta algo distinto.
   - **Accesibilidad**: si la pantalla/nodo es nuevo o cambió layout, marca si amerita spec en `e2e/a11y/`.
   - **Visual**: si el diseño es crítico o nuevo, marca si amerita spec en `e2e/visual/` con baseline.

6. **Entrega el plan** como tabla markdown con columnas: `nodo/arco del flow | HU (trazabilidad) | capa | rol/project | archivo destino sugerido | ¿duplica Cypress? | notas`. Incluye una fila de resumen con selectores faltantes detectados en el paso 4.

7. **Espera aprobación del usuario** antes de pasar a escribir specs. Si el usuario aprueba, la autoría queda en manos del agente `qa-playwright` (modo "Autoría/mantenimiento de tests").

## Qué evitar

- No abras `docs/04-historias/HU-XXX.md` para derivar criterios — el flow es la fuente primaria; el HU-XXX que aparece en sus comentarios es solo trazabilidad.
- No inventes nodos/arcos que el flow no tiene ni "mejores" el alcance — si un arco es ambiguo, dilo en el plan en vez de asumir.
- No marques algo como "no duplica Cypress" sin haber leído el spec Cypress real.
- No escribas specs Playwright dentro de esta skill — solo el plan.
