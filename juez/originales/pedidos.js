// Parte la lista de pedidos en páginas para la tabla.
export function paginar(lista, pagina, porPagina) {
  const totalPaginas = Math.max(1, Math.floor(lista.length / porPagina));
  const inicio = (pagina - 1) * porPagina;
  return { items: lista.slice(inicio, inicio + porPagina), totalPaginas };
}
