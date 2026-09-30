// Servidor de "Desactiva la bomba": sirve la tienda con bugs (app/), el panel de la bomba (panel/)
// y vuelve a correr el juez (juez/evaluar.mjs) cada vez que alguien guarda un archivo en app/src.
// Uso: npm start   (PORT=3001 para un segundo equipo, MINUTOS=10 para cambiar la duración)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const PORT = Number(process.env.PORT || 3000);
const DURACION_MS = Number(process.env.MINUTOS || 10) * 60_000;
const MAX_STRIKES = 3;
const APP = path.join(__dirname, 'app');
const SRC = path.join(APP, 'src');
const PANEL = path.join(__dirname, 'panel');
const ARCHIVO_ESTADO = path.join(__dirname, '.bomba', `estado-${PORT}.json`);
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' };

const CABLES = [
  { id: 'login', nombre: 'Ingreso', color: 'rojo' },
  { id: 'carrito', nombre: 'Carrito', color: 'azul' },
  { id: 'pedidos', nombre: 'Pedidos', color: 'amarillo' },
  { id: 'envios', nombre: 'Envíos', color: 'verde' },
  { id: 'cupon', nombre: 'Pago con cupón', color: 'blanco' },
  { id: 'notas', nombre: 'Notas del pedido', color: 'naranja' },
];

// fase: espera | corriendo | pausa | desactivada | explotada
const nuevoEstado = () => ({ fase: 'espera', inicio: null, pausadoMs: 0, pausaDesde: null, finMs: null, strikes: 0, modulos: {}, eventos: [] });
let estado = cargarEstado();

function cargarEstado() {
  try { return { ...nuevoEstado(), ...JSON.parse(fs.readFileSync(ARCHIVO_ESTADO, 'utf8')) }; } catch { return nuevoEstado(); }
}
function guardarEstado() {
  fs.mkdirSync(path.dirname(ARCHIVO_ESTADO), { recursive: true });
  fs.writeFileSync(ARCHIVO_ESTADO, JSON.stringify(estado, null, 2));
}

function transcurridoMs() {
  if (!estado.inicio) return 0;
  if (estado.finMs != null) return estado.finMs;
  const ahora = estado.pausaDesde ?? Date.now();
  return ahora - estado.inicio - estado.pausadoMs;
}
const reloj = (ms) => { const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const enJuego = () => estado.fase === 'corriendo' || estado.fase === 'pausa';

function evento(tipo, texto) {
  estado.eventos.push({ tipo, texto, reloj: reloj(transcurridoMs()) });
  console.log(`[${reloj(transcurridoMs())}] ${texto}`);
}

function terminar(fase, texto) {
  estado.finMs = transcurridoMs();
  estado.pausaDesde = null;
  estado.fase = fase;
  evento(fase === 'desactivada' ? 'fin-ok' : 'fin-mal', texto);
}

// Aplica un resultado nuevo del juez: corta cables, reconecta los que se rompieron y cuenta strikes.
function aplicarResultado(resultado) {
  for (const cable of CABLES) {
    const antes = estado.modulos[cable.id]?.estado;
    const ahora = resultado[cable.id] ?? { estado: 'error', pista: 'Sin respuesta del juez' };
    estado.modulos[cable.id] = ahora;
    if (!enJuego() || antes === ahora.estado) continue;
    if (ahora.estado === 'desactivado') evento('corte', `✂️ Cable ${cable.color} (${cable.nombre}) cortado`);
    else if (ahora.estado === 'mal') { estado.strikes++; evento('strike', `💥 Strike: ${cable.nombre}. ${ahora.pista}`); }
    else if (antes === 'desactivado' && ahora.estado !== 'error') { estado.strikes++; evento('strike', `💥 Strike: un cambio volvió a conectar el cable ${cable.color} (${cable.nombre})`); }
  }
  if (!enJuego()) return;
  if (estado.strikes >= MAX_STRIKES) terminar('explotada', '💣 BOOM: tres strikes');
  else if (CABLES.every((c) => estado.modulos[c.id]?.estado === 'desactivado')) terminar('desactivada', `💚 Bomba desactivada en ${reloj(transcurridoMs())}`);
}

let evaluando = false;
let pendiente = false;
function evaluar() {
  if (evaluando) { pendiente = true; return; }
  evaluando = true;
  execFile(process.execPath, [path.join(__dirname, 'juez', 'evaluar.mjs'), SRC], { timeout: 8000 }, (error, stdout) => {
    evaluando = false;
    let resultado;
    try { resultado = JSON.parse(stdout); } catch { resultado = Object.fromEntries(CABLES.map((c) => [c.id, { estado: 'error', pista: error ? 'El juez no terminó (¿un ciclo infinito?)' : 'Respuesta inválida del juez' }])); }
    aplicarResultado(resultado);
    guardarEstado();
    if (pendiente) { pendiente = false; evaluar(); }
  });
}

let espera;
fs.watch(SRC, { recursive: true }, () => { clearTimeout(espera); espera = setTimeout(evaluar, 600); });
setInterval(() => {
  if (estado.fase === 'corriendo' && transcurridoMs() >= DURACION_MS) { terminar('explotada', '💣 BOOM: se acabó el tiempo'); guardarEstado(); }
}, 250);

function resumen() {
  return {
    fase: estado.fase,
    restanteMs: Math.max(0, DURACION_MS - transcurridoMs()),
    duracionMs: DURACION_MS,
    strikes: estado.strikes,
    maxStrikes: MAX_STRIKES,
    cortados: CABLES.filter((c) => estado.modulos[c.id]?.estado === 'desactivado').length,
    cables: CABLES.map((c) => ({ ...c, ...(estado.modulos[c.id] ?? { estado: 'activo' }) })),
    eventos: estado.eventos.slice(-12),
  };
}

function iniciar() {
  if (estado.fase !== 'espera') return 'La bomba ya se usó. Corre "npm run reiniciar" para jugar otra vez.';
  const tocados = CABLES.filter((c) => (estado.modulos[c.id]?.estado ?? 'activo') !== 'activo');
  if (tocados.length) return `El código no está en su estado inicial (${tocados.map((c) => c.nombre).join(', ')}). Corre "npm run reiniciar".`;
  estado.fase = 'corriendo';
  estado.inicio = Date.now();
  evento('inicio', '⏱️ Cuenta regresiva iniciada');
  return null;
}

// Restaura los bugs originales y deja la bomba en espera. No se permite con la cuenta regresiva en marcha.
function reiniciar() {
  if (enJuego()) return 'No se puede reiniciar con la cuenta regresiva en marcha.';
  const originales = path.join(__dirname, 'juez', 'originales');
  for (const archivo of fs.readdirSync(originales)) fs.copyFileSync(path.join(originales, archivo), path.join(SRC, archivo));
  estado = nuevoEstado();
  guardarEstado();
  evaluar();
  return null;
}

function pausar() {
  if (estado.fase === 'corriendo') { estado.fase = 'pausa'; estado.pausaDesde = Date.now(); evento('pausa', '⏸️ Pausa'); }
  else if (estado.fase === 'pausa') { estado.pausadoMs += Date.now() - estado.pausaDesde; estado.pausaDesde = null; estado.fase = 'corriendo'; evento('pausa', '▶️ Continúa'); }
}

function responder(res, codigo, cuerpo) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(cuerpo));
}

function servirArchivo(res, raiz, relativa) {
  const ruta = path.normalize(path.join(raiz, relativa));
  if (!ruta.startsWith(raiz)) { res.writeHead(403); return res.end('Prohibido'); }
  fs.readFile(ruta, (err, data) => {
    if (err) { res.writeHead(404); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}

http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const ruta = decodeURIComponent(pathname);

  if (ruta === '/api/estado') return responder(res, 200, resumen());
  if (req.method === 'POST' && ruta === '/api/iniciar') {
    const error = iniciar();
    guardarEstado();
    return responder(res, error ? 409 : 200, error ? { error } : resumen());
  }
  if (req.method === 'POST' && ruta === '/api/reiniciar') {
    const error = reiniciar();
    return responder(res, error ? 409 : 200, error ? { error } : resumen());
  }
  if (req.method === 'POST' && ruta === '/api/pausa') { pausar(); guardarEstado(); return responder(res, 200, resumen()); }
  // Backend de las notas: responde con una demora aleatoria, como un servidor real bajo carga.
  if (req.method === 'POST' && ruta === '/api/guardar') {
    let texto = '';
    req.on('data', (parte) => (texto += parte));
    req.on('end', () => setTimeout(() => responder(res, 200, { texto, guardadoEn: new Date().toISOString() }), 100 + Math.random() * 900));
    return;
  }
  if (ruta === '/bomba') return servirArchivo(res, PANEL, 'bomba.html');
  if (ruta === '/marcador') return servirArchivo(res, PANEL, 'marcador.html');
  return servirArchivo(res, APP, ruta === '/' ? 'index.html' : ruta);
}).listen(PORT, () => {
  console.log(`☕ Tienda con bugs:  http://localhost:${PORT}/`);
  console.log(`💣 Bomba:            http://localhost:${PORT}/bomba`);
  evaluar();
});
