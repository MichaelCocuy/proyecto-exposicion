---
name: qa-write-spec-from-plan
description: Convierte un plan de pruebas ya aprobado (salida de qa-test-plan-from-flow) en specs Playwright reales — Page Object Model, selectores, naming por rol/project y comentario de referencia EP-XXX (flow) con HU-XXX como trazabilidad. Úsala después de que el usuario aprobó el plan de pruebas, para escribir o actualizar los archivos permanentes en playwright/tests/**.
---

Escribe **código real** dentro de `docfly-saas-docs-external-agent/playwright/`. A diferencia de `qa-test-plan-from-flow` (que solo planifica), esta skill sí crea/edita archivos — por eso exige un plan aprobado como entrada y respeta al pie de la letra la regla de aislamiento del agente `qa-playwright` (`.claude/agents/qa-playwright.md`): nunca tocar nada bajo `docfly-saas-docs/` (ni `gateway/` ni la suite Cypress).

## Prerrequisito

Necesitas un plan ya aprobado por el usuario (tabla `nodo/arco del flow | HU (trazabilidad) | capa | rol/project | archivo destino sugerido | ¿duplica Cypress? | notas` de `qa-test-plan-from-flow`). Si no existe, genera uno primero con esa skill o pide que te lo compartan — no improvises capa/rol/naming sin plan.

## Pasos

1. **Revalida el plan contra el código actual.** Si pasó tiempo entre el plan y ahora, confirma rápido en `gateway-src` que las pantallas/selectores involucrados no cambiaron. Si algo del plan ya no aplica (AC removido, selector renombrado), detente y repórtalo en vez de improvisar una solución distinta a la planeada.

2. **Selectores.** Para cada pantalla del plan, copia a mano a `playwright/support/selectors.ts` los `data-cy`/`data-testid` que falten (verificados en `gateway-src`, symlink de solo lectura). Nunca importes `gateway-src` en runtime — es solo lectura de referencia.

3. **Page Objects.** Si la pantalla no tiene page object en `playwright/support/pages/`, créalo (uno por pantalla, no por feature). Los métodos usan los selectores de `selectors.ts`, nunca literales inline.

4. **Escribe el/los spec(s)** en la ruta que indicó el plan, respetando naming por rol/project:
   - UI rol user → `playwright/tests/e2e/**/*.spec.ts` (project `chromium`)
   - UI rol admin → `playwright/tests/e2e/**/*.admin.spec.ts` (project `chromium-admin`)
   - API rol user → `playwright/tests/api/**/*.spec.ts` (project `api`, fixture `request`)
   - API rol admin → `playwright/tests/api/**/*.admin.spec.ts` (project `api-admin`)
   - a11y → `playwright/tests/e2e/a11y/**`, usando `scanA11y`/`expectNoA11yViolations` de `playwright/support/a11y.ts`
   - visual → `playwright/tests/e2e/visual/**`, usando `toHaveScreenshot`; define el `mask` de contenido dinámico por-spec (no global)
   - **Nunca mezcles dos roles en el mismo archivo** — si un spec necesita ambos, son dos archivos.

5. **Comentario de referencia EP/flow.** Encabeza el spec con la misma convención de referencia a `EP-XXX` (flow en `docs/06-flows`, nodo/arco del plan) y, como trazabilidad, el `HU-XXX` que traiga ese arco — que ya usa la suite Cypress. Revisa `gateway-src/src/test/javascript/cypress/e2e/` antes de inventar un formato nuevo.

6. **Respeta las marcas del plan.** Si una fila dice "duplica Cypress: sí", no la implementes salvo que el usuario justifique explícitamente por qué Playwright debe cubrirla también.

7. **Prioriza selectores `data-cy`/`data-testid`** sobre selectores de texto/CSS frágiles, salvo que no exista atributo — en ese caso dilo, no lo silencies.

8. **Corre el/los spec(s) nuevos** para confirmar que pasan (o fallan como se espera si son regresión intencional) antes de darlos por terminados. Sigue las reglas del agente `qa-playwright`: confirma qué roles tienen credenciales reales en `.env` antes de correr `npm test` completo; usa el project específico (`npx playwright test --project=... <archivo>`) en vez de la suite entera cuando solo cambiaste un spec.

## Qué evitar

- No escribas specs sin un plan aprobado como entrada.
- No toques `docfly-saas-docs/gateway` ni la suite Cypress bajo ningún motivo.
- No importes `gateway-src` en runtime — solo copia manual a `selectors.ts`.
- No mezcles roles user/admin en el mismo archivo de spec.
- No corras `test:visual:update` a ciegas si ya existe un baseline — eso esconde una regresión en vez de mostrarla.
- No levantes ni bajes infraestructura Docker/Keycloak/Kafka desde esta skill — solo consume el entorno que ya está arriba.
- No commitees `playwright/.auth/*.json`.
