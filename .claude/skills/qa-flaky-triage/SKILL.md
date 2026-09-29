---
name: qa-flaky-triage
description: Re-corre un test Playwright que falló, de forma aislada y repetida, para clasificar si es flaky (test/infra) o un bug real de la app — antes de tocar timeouts, retries o marcar el test como skip. Úsala cuando un spec falla mas no está claro si es un bug reproducible o ruido.
---

Clasifica, no "arregla a ciegas". El objetivo es decidir con evidencia si un test que falló es flaky (problema del test/timing/entorno) o si está exponiendo un bug real de la app — y en ese segundo caso, **reportarlo, no tocar el código de la app** ([[feedback-qa-report-only]] aplica también aquí).

## Pasos

1. **Aísla el test.** Identifica archivo + nombre exacto del test y su project (`chromium`/`chromium-admin`/`api`/`api-admin`). No re-corras la suite completa para triage — usa `--grep` o el archivo puntual, para que el ruido de otros tests no contamine la lectura.

2. **Confirma que no es causa ambiental antes de re-correr.** Igual que en `qa-bug-report` paso 1: ¿el entorno (`E2E_BASE_URL`, VPN/Docker) estaba arriba durante la corrida que falló? ¿el rol usado tiene credenciales reales en `.env`? Si el entorno estaba caído o mal configurado, no es flakiness ni bug — dilo y detente.

3. **Re-corre en aislamiento con evidencia.** Usa `--repeat-each=N` (N=5 como default razonable, ajusta si el usuario pide más) con `--trace on` sobre ese test puntual. Guarda cuántas de las N corridas pasaron/fallaron.

4. **Clasifica según el patrón:**
   - **N/N falla (determinístico):** no es flaky. Compara la traza contra el nodo/arco esperado del flow (`docs/06-flows/EP-XXX-*.md`) — si el comportamiento observado contradice lo que describe el arco, es un bug de la app → usa `qa-bug-report` para reportarlo, no lo "arregles" ajustando el test. Si en cambio el test mismo está mal escrito (selector roto, assertion equivocada, no espera un estado real), esa sí es una corrección legítima de código de test — corrígelo tú mismo, es `playwright/`, no la app.
   - **0/N falla tras el fallo inicial:** posible ruido puntual (config/infra del momento). No lo llames "flaky confirmado" con una sola muestra — si vuelve a ocurrir en otra sesión, sí amerita triage completo.
   - **Intermitente (mezcla de pass/fail):** flaky real. Identifica la categoría de causa raíz comparando la traza de una corrida que pasó vs. una que falló:
     - *Timing/race en el test*: falta un `await` o una espera explícita de un estado (no un `waitForTimeout` ciego) — corrección legítima en el spec/page object.
     - *Contaminación de datos entre tests*: el test asume estado que otro test dejó — corrección legítima en fixtures/setup del proyecto Playwright.
     - *Latencia de entorno* (VPN/dev remoto compartido): anótalo como limitación conocida del entorno, no como bug ni como defecto del test.
     - *Race condition real en la app* (la UI también es inconsistente para un usuario real, no solo para el test): esto **es un bug**, aunque se manifieste como flakiness — repórtalo con `qa-bug-report`, no lo enmascares con un retry o un `waitForTimeout` más largo.

5. **Nunca ocultes flakiness sin diagnosticar.** No subas `retries` en `playwright.config.ts`, no agregues `test.skip`/`test.fixme`, ni alargues timeouts globales solo para que el test "pase" sin haber identificado la categoría del paso 4 — eso esconde la señal en vez de resolverla (mismo principio que ya aplica la suite a visual testing: no subir el umbral a ciegas).

6. **Entrega el resultado como tabla/resumen:** test | project | corridas (pass/fail) | categoría | evidencia (rutas de trace de una corrida pass y una fail) | acción tomada o recomendada (corrección de test aplicada / bug reportado vía `qa-bug-report` / limitación de entorno anotada).

## Qué evitar

- No clasifiques como flaky con una sola re-corrida — usa el muestreo de `--repeat-each`.
- No toques código de `docfly-saas-docs/gateway` ni de ningún app — si la causa raíz es de la app, se reporta, no se arregla desde aquí.
- No enmascares flakiness con retries/timeouts/skip sin haber identificado la categoría de causa raíz.
- No re-corras la suite completa para triage de un solo test — aísla con `--grep`/archivo puntual.
