// Servidor estático sin dependencias para correr el juego en local.
// Uso: node server.js  (puerto por defecto 3000, o PORT=4000 node server.js)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let ruta = path.normalize(path.join(PUBLIC, decodeURIComponent(url.pathname)));
  if (!ruta.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Prohibido'); }
  if (fs.existsSync(ruta) && fs.statSync(ruta).isDirectory()) ruta = path.join(ruta, 'index.html');
  fs.readFile(ruta, (err, data) => {
    if (err) { res.writeHead(404); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`La última cosecha corriendo en http://localhost:${PORT}/?caso=4821`));
