// Guarda la nota del pedido en el servidor y muestra lo que quedó guardado.
export function crearAutoguardado({ enviar, mostrar }) {
  return async function guardar(texto) {
    const respuesta = await enviar(texto);
    mostrar(respuesta.texto);
  };
}
