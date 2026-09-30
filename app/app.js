// Conecta la interfaz con la lógica de cada módulo (app/src). Los bugs están en app/src, no aquí.
import { validarCorreo } from './src/login.js';
import { calcularTotal } from './src/carrito.js';
import { paginar } from './src/pedidos.js';
import { buscarCiudades } from './src/envios.js';
import { calcularTotalConCupon } from './src/cupon.js';
import { crearAutoguardado } from './src/notas.js';

const $ = (id) => document.getElementById(id);
const pesos = (valor) => '$' + valor.toLocaleString('es-CO');

// 1 · Ingreso
$('form-login').addEventListener('submit', (evento) => {
  evento.preventDefault();
  const { correo, clave } = evento.target.elements;
  if (!clave.value) return ($('resultado-login').textContent = 'Escribe la clave');
  $('resultado-login').textContent = validarCorreo(correo.value)
    ? `Bienvenido, ${correo.value.trim()}`
    : 'Correo inválido';
});

// 2 · Carrito
const productos = [
  { nombre: 'Café Excelso (bolsa 500 g)', precio: 19.99, cantidad: 1 },
  { nombre: 'Taza de cerámica', precio: 8.95, cantidad: 0 },
  { nombre: 'Filtro de tela', precio: 4.35, cantidad: 0 },
];
$('productos').innerHTML = productos
  .map((p, i) => `<tr><td>${p.nombre}</td><td>$${p.precio.toFixed(2)}</td>
    <td><input type="number" min="0" value="${p.cantidad}" data-i="${i}" aria-label="Cantidad de ${p.nombre}"></td></tr>`)
  .join('');
const pintarCarrito = () => ($('total-carrito').textContent = '$' + calcularTotal(productos).toFixed(2));
$('productos').addEventListener('input', (evento) => {
  productos[evento.target.dataset.i].cantidad = Number(evento.target.value) || 0;
  pintarCarrito();
});
pintarCarrito();

// 3 · Pedidos
const clientes = ['Ana', 'Luis', 'Marta', 'Jorge', 'Paula', 'Andrés', 'Sofía', 'Camilo'];
const pedidos = Array.from({ length: 23 }, (_, i) => ({
  numero: i + 1,
  cliente: clientes[i % clientes.length],
  valor: 35000 + ((i * 7919) % 90) * 1000,
}));
let pagina = 1;
function pintarPedidos() {
  const { items, totalPaginas } = paginar(pedidos, pagina, 5);
  $('filas-pedidos').innerHTML = items
    .map((p) => `<tr><td>#${p.numero}</td><td>${p.cliente}</td><td>${pesos(p.valor)}</td></tr>`)
    .join('');
  $('pagina-actual').textContent = `Página ${pagina} de ${totalPaginas}`;
  $('pagina-anterior').disabled = pagina <= 1;
  $('pagina-siguiente').disabled = pagina >= totalPaginas;
}
$('pagina-anterior').addEventListener('click', () => { pagina--; pintarPedidos(); });
$('pagina-siguiente').addEventListener('click', () => { pagina++; pintarPedidos(); });
pintarPedidos();

// 4 · Envíos
const ciudades = ['Armenia', 'Barranquilla', 'Bogotá', 'Bucaramanga', 'Cali', 'Cartagena', 'Cúcuta', 'Ibagué',
  'Manizales', 'Medellín', 'Montería', 'Pasto', 'Pereira', 'Popayán', 'Salento', 'San Andrés', 'Santa Marta', 'Villavicencio'];
function pintarCiudades() {
  const encontradas = buscarCiudades(ciudades, $('buscar-ciudad').value);
  $('ciudades').innerHTML = encontradas.length
    ? encontradas.map((c) => `<li>${c}</li>`).join('')
    : '<li class="vacio">Sin resultados</li>';
}
$('buscar-ciudad').addEventListener('input', pintarCiudades);
pintarCiudades();

// 5 · Pago con cupón
function pintarCupon() {
  const { subtotal, cupon } = $('form-cupon').elements;
  $('total-cupon').textContent = pesos(calcularTotalConCupon(Number(subtotal.value) || 0, cupon.value));
}
$('form-cupon').addEventListener('submit', (evento) => { evento.preventDefault(); pintarCupon(); });
pintarCupon();

// 6 · Notas del pedido
const guardar = crearAutoguardado({
  enviar: (texto) => fetch('/api/guardar', { method: 'POST', body: texto }).then((r) => r.json()),
  mostrar: (texto) => ($('nota-guardada').textContent = `Guardado: «${texto}»`),
});
$('guardar-nota').addEventListener('click', () => {
  $('nota-guardada').textContent = 'Guardando…';
  guardar($('nota').value);
});

// Estado de la bomba en la barra superior
async function pintarBomba() {
  try {
    const estado = await fetch('/api/estado').then((r) => r.json());
    const s = Math.max(0, Math.ceil(estado.restanteMs / 1000));
    $('bomba-tiempo').textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    $('bomba-cables').textContent = `${estado.cortados}/6 cables`;
    $('bomba-strikes').textContent = `strikes ${estado.strikes}/3`;
    document.body.dataset.fase = estado.fase;
  } catch { /* el servidor se está reiniciando */ }
}
setInterval(pintarBomba, 1000);
pintarBomba();
