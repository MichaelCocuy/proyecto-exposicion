# Desactiva la bomba 💣☕

Un ejercicio para aprender a trabajar con un **agente de QA con Playwright**. La tienda de Café La Esmeralda tiene seis bugs reportados por clientes, y cada bug es un cable de una bomba. Tu equipo guía a Claude para que los encuentre, los arregle y lo demuestre en el navegador. Hay **10 minutos** y **3 strikes**. Gana el equipo que la desactive primero.

El agente no adivina. Reproduce cada bug con el Playwright MCP, te pregunta cuando la regla de negocio no está clara, arregla y lo verifica en pantalla. Al final convierte lo que hizo en pruebas automatizadas.

## Qué necesitas

- **Node.js 20.11 o superior** y **Git**.
- **Claude Code** instalado y con sesión iniciada.
- **Google Chrome**: el MCP de Playwright lo usa para abrir el navegador.

## Preparación

```bash
git clone https://github.com/MichaelCocuy/proyecto-exposicion.git
cd proyecto-exposicion
npm install
npx playwright install chromium
npm start
```

Abre `http://localhost:3000/` (la tienda) y `http://localhost:3000/bomba` (tu bomba). En otra terminal, dentro de la misma carpeta:

```bash
claude
```

En esta carpeta, Claude arranca como el agente **`qa-playwright`**. La primera vez te pide confiar en la carpeta y aprobar el MCP de Playwright: acepta las dos cosas.

## Cómo se juega

1. **Espera la señal del presentador.** Pulsa "Iniciar cuenta regresiva" en `/bomba`, o el presentador arranca todas las bombas a la vez desde el marcador.
2. **Dale el arranque al agente**, por ejemplo:
   ```
   Desactiva la bomba. La tienda está en http://localhost:3000. Tienes 10 minutos.
   Empieza con qa-plan-bugs, arregla cada módulo con qa-arreglar-con-mcp y deja
   Notas del pedido para el final con qa-triage-flaky.
   ```
3. **Cuando el agente pregunte una regla de negocio**, llévale la pregunta al presentador: él es el desarrollador que conoce el negocio. Vuelve con la respuesta y elígela, o escríbela en "Other".
4. **Sigue la bomba en `/bomba`.** Si un cable dice "Casi…", la pista dice qué falta. Pásasela al agente.
5. **Cuando la bomba esté desactivada**, pídele que convierta lo que hizo en pruebas (`qa-escribir-spec`) y que escriba el informe (`qa-reporte-bug`).

## Los seis cables

| Cable | Módulo | Qué reporta el cliente |
|---|---|---|
| 🔴 | Ingreso | Rechaza su correo con mayúsculas |
| 🔵 | Carrito | El total sale un centavo menos |
| 🟡 | Pedidos | Faltan los últimos pedidos en la tabla |
| 🟢 | Envíos | "bogota" no encuentra Bogotá |
| ⚪ | Pago con cupón | La web cobra distinto que la caja |
| 🟠 | Notas del pedido | A veces se guarda la versión vieja |

Dos de ellos son **ambiguos a propósito**: hay más de una forma razonable de arreglarlos, y solo el presentador sabe cuál quiere el negocio.

## Reglas

- **Nadie abre `juez/`**: ni el agente ni ustedes. Ahí están las pruebas de aceptación ocultas. Al agente se lo bloquean los permisos y un hook; a ustedes, su palabra.
- **Los arreglos van en `app/src/`.** La interfaz (`app/index.html`, `app/app.js`) no tiene bugs.
- **Cada guardado en `app/src/` se evalúa al instante.** Suman strike un arreglo que el negocio no quería y un cambio que vuelve a conectar un cable ya cortado. Con 3 strikes, o cuando el reloj llega a 0:00, la bomba explota.
- **Pregúntenle al presentador todo lo que quieran.** Responde reglas de negocio, no código.

## Cómo se evalúa

Cada vez que se guarda un archivo en `app/src/`, el juez corre las pruebas de aceptación y actualiza la bomba:

- **Cortado ✂️**: el bug quedó bien arreglado.
- **Casi…**: va bien, pero falta algo. La pista dice qué: preguntarle al desarrollador, probar casos borde o no cambiar el tipo de retorno.
- **Strike**: un arreglo que el negocio no quería, o un cable cortado que se vuelve a conectar.

## Consejos para guiar al agente

- **Describe el síntoma, no la solución.** "A veces se guarda la versión vieja, reprodúcelo" funciona mejor que "agrega un contador".
- **Pídele evidencia.** "Muéstrame el ❌ en el navegador antes de cambiar código."
- **Pásale las pistas de la bomba tal cual.** "El cable de Ingreso dice Casi… y habla de casos borde. Prueba tres casos más en el navegador."
- **Cuida el reloj.** "Quedan 3 minutos: termina el cable más cercano a cortarse y no empieces otro."
- **Si se desvía, córtalo.** "Durante los 10 minutos solo navegador y arreglos. Las pruebas van al final."

## Entre partidas

```bash
npm run reiniciar               # restaura los 6 bugs y deja la bomba en espera
npm run reiniciar -- --pruebas  # además borra las pruebas escritas (conserva tests/seed.spec.ts)
```

Con el servidor corriendo, también se puede reiniciar desde el botón "Reiniciar" de `/bomba`. Para otra duración: `MINUTOS=15 npm start`.

## Para el presentador

- **El marcador** muestra las bombas de todos los equipos. Cada equipo te da la IP de su máquina, en la misma red:
  ```
  http://localhost:3000/marcador?e=Equipo%201@http://192.168.1.20:3000&e=Equipo%202@http://192.168.1.21:3000
  ```
  "Iniciar todas" arranca las bombas a la vez. Si el firewall de algún equipo bloquea el puerto 3000, ese equipo inicia desde su propio `/bomba` cuando des la señal.
- **La guía con las respuestas** va en `juez/README.md`, solo en tu máquina. Está en `.gitignore` porque el repo es público: no la subas.

## Estructura

```
app/                  la tienda con bugs
  src/*.js            la lógica de cada módulo: aquí están los bugs
panel/                la bomba (/bomba) y el marcador (/marcador)
juez/                 pruebas de aceptación ocultas y bugs originales (no abrir)
tests/seed.spec.ts    prueba semilla: los 6 módulos cargan
.claude/              agente qa-playwright, skills, permisos y el hook que protege el juez
CLAUDE.md             contexto del ejercicio para Claude
scripts/reiniciar.mjs
server.js             sirve todo y corre el juez cuando cambia app/src
```
