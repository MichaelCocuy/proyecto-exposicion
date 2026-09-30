// Hook PreToolUse: bloquea cualquier herramienta (Bash, Grep, Glob, MCP…) que intente tocar el juez
// o el estado de la bomba. Las reglas "deny" de settings.json cubren Read/Edit/Write; esto cubre el resto.
let entrada = '';
process.stdin.on('data', (parte) => (entrada += parte));
process.stdin.on('end', () => {
  let herramienta = {};
  try { herramienta = JSON.parse(entrada).tool_input ?? {}; } catch { process.exit(0); }
  if (/juez|\.bomba/i.test(JSON.stringify(herramienta))) {
    console.error('Bloqueado: juez/ y .bomba/ están fuera de los límites del juego. La fuente de verdad son los tickets, la tienda y el desarrollador.');
    process.exit(2);
  }
  process.exit(0);
});
