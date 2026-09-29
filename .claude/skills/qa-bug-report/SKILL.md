---
name: qa-bug-report
description: Convierte un hallazgo de QA exploratorio en exodocs/gateway (vía Playwright) en un reporte de bug estructurado con pasos de reproducción, entorno, evidencia, severidad, contexto ampliado y el resto de hallazgos de la sesión. Úsala inmediatamente después de reproducir un comportamiento inesperado durante QA exploratorio, antes de perder el contexto de la sesión.
---

Produce un **reporte de bug listo para pegar** en un issue/PR, en markdown. No crea el issue en GitHub por sí sola — eso requiere pedido explícito del usuario, dado que es una acción visible para otros.

## Pasos

1. **Descarta causas ambientales primero.** Antes de reportar como bug de la app, revisa:
   - ¿El `.env` activo apunta a un entorno que responde (VPN encendida si es dev remoto, stack Docker levantado si es local)? Ver `.claude/agents/qa-playwright.md` sección "Prerrequisito".
   - ¿El rol usado tiene credenciales reales en `.env`, o el fallo es en realidad un rol sin provisionar?
   - Si el entorno es remoto/compartido (VPN, staging): ¿el diff puede deberse a datos reales no-seed en vez de un bug de layout/lógica?
   Si alguna de estas aplica, no es un bug — dilo y detente aquí.

2. **Confirma reproducibilidad.** Ejecuta el paso sospechoso al menos 2 veces (usa `--headed`, `--trace on` o `test:ui` para observar). Si el resultado es intermitente, no lo reportes como bug determinista — anótalo como posible flaky y considera la skill/triage de flakiness en vez de esta.

3. **Recolecta evidencia.** Usa el `trace.zip`/screenshot que Playwright generó en `playwright/.output/` para esa corrida. Si no quedó evidencia grabada, vuelve a correr con `trace: on` antes de reportar — no reportes solo de memoria.

4. **Recolecta datos de entorno:**
   - `E2E_BASE_URL` activo (de `.env`) y si es local Docker o dev remoto VPN.
   - Rol/usuario usado (user/admin, sin exponer credenciales reales en el reporte).
   - Browser (`chromium` por default en esta suite).
   - EP/flow relacionado si el hallazgo ocurrió validando un nodo/arco de navegación (`docs/06-flows/EP-XXX-*.md`); cita el `HU-XXX` del comentario del arco solo como trazabilidad.

5. **Redacta el reporte con esta estructura:**

```markdown
## [Título: acción esperada vs. observada, en una línea]

**Severidad:** bloqueante | alta | media | baja
(bloqueante = impide un flujo crítico del EP; alta = rompe un arco del flow pero hay workaround; media/baja = cosmético o edge case)

**Entorno:** local Docker | VPN dev remoto — rol: user|admin — browser: chromium
**EP/flow relacionado:** EP-XXX (docs/06-flows) — HU-XXX de trazabilidad si aplica

**Pasos de reproducción:**
1. ...
2. ...
(mínimos e imprescindibles — reduce antes de reportar)

**Resultado esperado:** ...
**Resultado actual:** ...

**Evidencia:** ruta a trace.zip / screenshot en `playwright/.output/...`

**Reproducibilidad:** consistente (2/2) | intermitente

**Contexto ampliado:**
[Qué se investigó para llegar a esta conclusión: causas ambientales descartadas y cómo (paso 1), alcance revisado — nodos/arcos del flow EP-XXX involucrados (y el HU-XXX de trazabilidad de cada uno), código o selectores de `gateway-src` consultados, cualquier spec Cypress/Playwright existente que ya tocara esta área. Esto es la narrativa detrás del reporte corto, no un resumen — sirve para que quien lo lea no tenga que re-investigar lo ya descartado.]

**Hallazgos:**
- [Todo lo observado durante la sesión de exploración, no solo el bug principal reportado arriba: comportamientos sospechosos secundarios, edge cases notados, cosas a vigilar aunque no ameriten reporte propio. Marca cada uno como "reportado como bug principal" / "anotado para seguimiento, no bloqueante" / "descartado (causa ambiental)".]
```

6. **Sugiere el siguiente paso** al final del reporte: si amerita spec de regresión permanente, indica capa/project/archivo sugerido (puedes invocar `qa-test-plan-from-flow` para ese detalle) o si basta con el reporte para que otro lo triage.

7. **Nunca omitas "Contexto ampliado" ni "Hallazgos".** Aunque el hallazgo parezca simple y aislado, completa igual ambas secciones — el punto es que quien lea el reporte reciba todo lo que se investigó y se observó en la sesión, no solo el bug puntual. Si de verdad no hubo nada más que observar, dilo explícitamente ("sin hallazgos adicionales en esta sesión") en vez de omitir la sección.

## Qué evitar

- No reportes un fallo como "bug de la app" sin haber descartado causas ambientales (paso 1).
- No abras un issue/PR real sin que el usuario lo pida explícitamente.
- No incluyas credenciales, cookies ni contenido de `playwright/.auth/*.json` en el reporte.
