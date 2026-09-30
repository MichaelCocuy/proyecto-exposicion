// Juez de la bomba: pruebas de aceptación ocultas contra app/src.
// El servidor lo corre en un proceso aparte cada vez que cambia app/src e imprime un JSON por stdout.
// Estados por módulo: activo (el bug sigue), parcial (va bien, falta algo), mal (arreglo que el negocio
// no quiere: strike), desactivado (cable cortado), error (el módulo no carga).
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const SRC = path.resolve(process.argv[2] ?? 'app/src');
const cargar = (archivo) => import(pathToFileURL(path.join(SRC, archivo)).href + '?v=' + Date.now());
const casi = (a, b) => typeof a === 'number' && Math.abs(a - b) < 1e-9;
const PISTA_PREGUNTA = 'Va bien, pero todavía no es lo que espera el negocio. ¿Ya le preguntaron al desarrollador?';

function contar(casos) {
  let pasan = 0;
  for (const caso of casos) {
    try { if (caso()) pasan++; } catch { /* un caso que revienta cuenta como fallido */ }
  }
  return pasan;
}

const jueces = {
  async login() {
    const { validarCorreo } = await cargar('login.js');
    const validos = ['ana@trycore.com', 'Michael.Cocuy@Trycore.com', ' ana@trycore.com ', 'ANA.PEREZ@TRYCORE.COM.CO', 'luis_2@cafe-esmeralda.co\t'];
    const invalidos = ['', '   ', 'ana@', 'ana.trycore.com', '@trycore.com', 'ana@trycore', 'ana perez@trycore.com', 'ana@@trycore.com'];
    const pasan = contar([...validos.map((c) => () => validarCorreo(c) === true), ...invalidos.map((c) => () => validarCorreo(c) === false)]);
    return pasan === validos.length + invalidos.length ? { estado: 'desactivado' } : { estado: 'activo' };
  },

  async carrito() {
    const { calcularTotal } = await cargar('carrito.js');
    const casos = [
      [[{ precio: 19.99, cantidad: 1 }], 19.99],
      [[{ precio: 19.99, cantidad: 5 }], 99.95],
      [[{ precio: 4.35, cantidad: 7 }, { precio: 8.95, cantidad: 2 }], 48.35],
      [[{ precio: 0.1, cantidad: 1 }, { precio: 0.2, cantidad: 1 }], 0.3],
      [[{ precio: 1.15, cantidad: 3 }, { precio: 2.55, cantidad: 4 }], 13.65],
      [[], 0],
    ];
    const pasan = contar(casos.map(([items, esperado]) => () => casi(calcularTotal(items), esperado)));
    return pasan === casos.length ? { estado: 'desactivado' } : { estado: 'activo' };
  },

  async pedidos() {
    const { paginar } = await cargar('pedidos.js');
    const lista = (n) => Array.from({ length: n }, (_, i) => i + 1);
    const casos = [
      () => paginar(lista(23), 1, 5).totalPaginas === 5,
      () => paginar(lista(23), 5, 5).items.join() === '21,22,23',
      () => paginar(lista(20), 1, 5).totalPaginas === 4,
      () => paginar(lista(21), 1, 10).totalPaginas === 3,
      () => paginar(lista(3), 1, 5).totalPaginas === 1,
      () => paginar(lista(23), 2, 5).items.join() === '6,7,8,9,10',
    ];
    return contar(casos) === casos.length ? { estado: 'desactivado' } : { estado: 'activo' };
  },

  // Ambiguo a propósito: ignorar tildes y mayúsculas, y buscar por "contiene" (no solo "empieza por").
  async envios() {
    const { buscarCiudades } = await cargar('envios.js');
    const ciudades = ['Armenia', 'Bogotá', 'Cali', 'Cúcuta', 'Ibagué', 'Medellín', 'Popayán', 'San Andrés', 'Santa Marta', 'Salento'];
    const busca = (texto, esperado) => () => buscarCiudades(ciudades, texto).join() === esperado.join();
    const tildes = [busca('bogota', ['Bogotá']), busca('BOGOTÁ', ['Bogotá']), busca('cucuta', ['Cúcuta']), busca(' cali ', ['Cali'])];
    const contiene = [busca('llin', ['Medellín']), busca('marta', ['Santa Marta']), busca('an', ['Popayán', 'San Andrés', 'Santa Marta']), busca('', ciudades)];
    const pasanTildes = contar(tildes);
    const pasanContiene = contar(contiene);
    if (pasanTildes === tildes.length && pasanContiene === contiene.length) return { estado: 'desactivado' };
    if (pasanTildes === tildes.length || pasanContiene > 1) return { estado: 'parcial', pista: PISTA_PREGUNTA };
    return { estado: 'activo' };
  },

  // Ambiguo a propósito: el cupón se resta ANTES del IVA y el total nunca es negativo.
  async cupon() {
    const { calcularTotalConCupon } = await cargar('cupon.js');
    const total = (subtotal, cupon) => { try { return calcularTotalConCupon(subtotal, cupon); } catch { return NaN; } };
    const sinCupon = total(50000, '') === 59500 && total(50000, 'XYZ') === 59500;
    const principal = total(50000, 'CAFE10K');
    if (principal === 49500) return { estado: 'mal', pista: 'El total con cupón no es el que cobra la caja.' };
    const pequeno = total(6000, 'CAFE10K');
    if (sinCupon && principal === 47600 && total(120000, 'CAFE10K') === 130900 && pequeno === 0) return { estado: 'desactivado' };
    if (sinCupon && principal === 47600) return { estado: 'parcial', pista: PISTA_PREGUNTA };
    return { estado: 'activo' };
  },

  async notas() {
    const { crearAutoguardado } = await cargar('notas.js');
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
    async function escenario(demoras) {
      const mostrados = [];
      const guardar = crearAutoguardado({
        enviar: (texto) => esperar(demoras[Number(texto.slice(1))]).then(() => ({ texto })),
        mostrar: (texto) => mostrados.push(texto),
      });
      for (let i = 0; i < demoras.length; i++) { guardar('v' + i); await esperar(2); }
      await esperar(Math.max(...demoras) * demoras.length + 50);
      const orden = mostrados.map((t) => Number(t.slice(1)));
      const ultimo = 'v' + (demoras.length - 1);
      return mostrados.at(-1) === ultimo && orden.every((n, i) => i === 0 || n >= orden[i - 1]);
    }
    const resultados = await Promise.all([escenario([60, 5]), escenario([5, 5]), escenario([40, 80, 10]), escenario([10])]);
    return resultados.every(Boolean) ? { estado: 'desactivado' } : { estado: 'activo' };
  },
};

const salida = {};
for (const [id, juez] of Object.entries(jueces)) {
  try {
    salida[id] = await juez();
  } catch (error) {
    salida[id] = { estado: 'error', pista: `El módulo no carga: ${error.message.split('\n')[0]}` };
  }
}
process.stdout.write(JSON.stringify(salida));
process.exit(0);
