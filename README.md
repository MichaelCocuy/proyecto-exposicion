# Desactiva la bomba 💣☕

Demo para desarrolladores: **un agente de QA con Playwright contra un equipo de desarrolladores**. La tienda de Café La Esmeralda tiene seis bugs reportados por clientes, y cada bug es un cable de una bomba. Arreglarlo bien corta el cable. Hay **10 minutos** y **3 strikes**.

La idea es mostrar que un agente de Playwright no solo "hace clic": reproduce el bug, lo encierra en una prueba que falla, le **pregunta al desarrollador** cuando el requisito es ambiguo, arregla y lo demuestra con la prueba en verde.

## Los seis cables

| # | Cable | Módulo | Qué reporta el cliente | Qué muestra el agente |
|---|---|---|---|---|
| 1 | 🔴 | Ingreso | Rechaza su correo con mayúsculas | Localizadores accesibles, pruebas parametrizadas |
| 2 | 🔵 | Carrito | El total sale un centavo menos | Aserciones exactas sobre la interfaz |
| 3 | 🟡 | Pedidos | Faltan los últimos pedidos en la tabla | Paginación |
| 4 | 🟢 | Envíos | "bogota" no encuentra Bogotá | **Preguntar al desarrollador** |
| 5 | ⚪ | Pago con cupón | La web cobra distinto que la caja | **Preguntar al desarrollador** |
| 6 | 🟠 | Notas del pedido | A veces se guarda la versión vieja | Intermitencia e intercepción de red (`page.route`) |

Los módulos 4 y 5 son **ambiguos a propósito**: hay más de una forma razonable de arreglarlos y solo el desarrollador (el presentador) sabe cuál quiere el negocio. Si alguien adivina mal, suma un strike.

## Cómo se evalúa

Cada vez que alguien guarda un archivo en `app/src/`, un juez corre pruebas de aceptación ocultas (`juez/`) y actualiza la bomba:

- **Cortado ✂️**: el bug quedó bien arreglado.
- **Casi…**: va bien, pero falta algo. La pista dice qué: preguntarle al desarrollador, probar casos borde o no cambiar el tipo de retorno.
- **Strike**: un arreglo que el negocio no quería, o un cambio que vuelve a conectar un cable ya cortado.
- **💥 BOOM**: 3 strikes o se acabó el tiempo. **💚 Desactivada**: los 6 cables cortados.

## Preparación

```bash
npm install
npx playwright install chromium
```

El agente necesita el MCP de Playwright para navegar. Viene configurado en `.mcp.json`; Claude Code pide aprobarlo la primera vez.

### Dos equipos, dos copias del código

Cada equipo arregla su propia copia. En la misma máquina, lo más simple es un worktree para los desarrolladores:

```bash
git worktree add ../bomba-devs
cd ../bomba-devs && npm install && npm run start:devs   # desarrolladores → http://localhost:3001
```

Y en esta carpeta, para el agente:

```bash
npm start                                              # agente → http://localhost:3000
```

Si los desarrolladores trabajan en otra máquina, clonan el repo, corren `npm start` allá y el marcador apunta a su IP.

### El marcador

Proyecta las dos bombas lado a lado:

```
http://localhost:3000/marcador?e=Agente@http://localhost:3000&e=Desarrolladores@http://localhost:3001
```

"Iniciar todas" arranca los dos cronómetros a la vez. Cada bomba también tiene su página propia en `/bomba`, con pausa y reinicio.

## Cómo juega el agente

```bash
claude --agent qa-playwright
```

Tiene que correr como **sesión principal**, no como subagente, para poder hacerte preguntas. Dile algo como *"Desactiva la bomba. La tienda está en http://localhost:3000"*.

Todo pasa en el **navegador del Playwright MCP**, que se abre visible. Proyéctalo junto a `/bomba`: el público ve el ❌, el arreglo, el ✅ y el cable que se corta. Al final, con el reloj detenido, el agente convierte lo que hizo en pruebas.

El agente (`.claude/agents/qa-playwright.md`) trabaja con cinco skills:

| Skill | Cuándo | Qué hace |
|---|---|---|
| `qa-plan-bugs` | Al empezar | Lee los tickets, reproduce cada bug con el MCP, clasifica y hace **una ronda de preguntas** |
| `qa-arreglar-con-mcp` | Por cada bug | ❌ en el navegador → arreglo en `app/src/` → ✅ en el navegador → cable cortado |
| `qa-triage-flaky` | Bug de Notas | Fuerza la carrera con `page.route` para que el ❌ aparezca siempre |
| `qa-escribir-spec` | Con la bomba desactivada | Convierte los pasos del MCP en `tests/bugs/*.spec.ts`: rojas con los bugs, verdes con los arreglos |
| `qa-reporte-bug` | Al final | Informe en `reportes/`: causa raíz, arreglo, prueba y línea de tiempo |

Para el bug de Notas, el agente usa `browser_run_code_unsafe`, que siempre pide tu confirmación. Lee el código en pantalla antes de aprobarlo: es parte del show.

## Reglas

- **Nadie abre `juez/`.** Al agente se lo bloquean `.claude/settings.json` y un hook (`.claude/hooks/proteger-juez.mjs`); los desarrolladores dan su palabra. El bloqueo aplica a **cualquier** sesión de Claude Code en esta carpeta: para editar el juez, desactiva la regla un momento.
- Los permisos que necesita el agente (el MCP, escribir en `app/src/` y `tests/`, correr Playwright) ya están aprobados en `.claude/settings.json`, para que la demo no se detenga en diálogos de permisos.
- Los arreglos van en `app/src/`. La interfaz (`app/index.html`, `app/app.js`) no tiene bugs.
- Los desarrolladores arreglan **sin IA**. Los dos equipos pueden hacerle al presentador todas las preguntas que quieran.
- Mismo cronómetro y mismos tickets para los dos.

## Entre partidas

```bash
npm run reiniciar               # restaura los 6 bugs y deja la bomba en espera
npm run reiniciar -- --pruebas  # además borra las pruebas escritas (conserva tests/seed.spec.ts)
```

Con el servidor corriendo, el reinicio también se puede hacer desde el botón "Reiniciar" en `/bomba`. Para otro puerto: `PORT=3001 npm run reiniciar`. Para otra duración: `MINUTOS=15 npm start`.

## Estructura

```
app/                  la tienda con bugs
  src/*.js            la lógica de cada módulo: aquí están los bugs
panel/                la bomba (/bomba) y el marcador (/marcador)
juez/                 pruebas de aceptación ocultas y bugs originales (no abrir)
tests/seed.spec.ts    prueba semilla: los 6 módulos cargan
.claude/              agente qa-playwright, skills, permisos y el hook que protege el juez
scripts/reiniciar.mjs
server.js             sirve todo y corre el juez cuando cambia app/src
```
