# Desactiva la bomba

Este repo es un ejercicio: una tienda (`app/`) con 6 bugs conectados a una bomba de 10 minutos. Cada equipo usa Claude Code como agente de QA con Playwright para desactivarla.

- En esta carpeta, `claude` arranca como el agente `qa-playwright` (`.claude/settings.json`). Si la sesión no arrancó como el agente, lee `.claude/agents/qa-playwright.md` y sigue esas instrucciones en esta misma sesión. No lo lances como subagente: un subagente no puede hacerle preguntas al equipo.
- Las skills del ejercicio están en `.claude/skills/` (`qa-plan-bugs`, `qa-arreglar-con-mcp`, `qa-triage-flaky`, `qa-escribir-spec`, `qa-reporte-bug`).
- `juez/`, `server.js` y `.bomba/` están fuera de los límites: no se leen ni se modifican, por ningún medio.
- Los arreglos van solo en `app/src/`, y cada archivo se guarda de una sola vez.
