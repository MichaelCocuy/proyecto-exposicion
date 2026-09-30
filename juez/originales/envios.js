// Filtra las ciudades de envío según lo que el cliente escribe en el buscador.
export function buscarCiudades(ciudades, texto) {
  return ciudades.filter((ciudad) => ciudad.startsWith(texto));
}
