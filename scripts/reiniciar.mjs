// Deja la bomba lista para otra partida: restaura los bugs originales en app/src y borra el estado.
// Uso: npm run reiniciar               (conserva las pruebas escritas en tests/)
//      npm run reiniciar -- --pruebas  (también borra las pruebas, menos tests/seed.spec.ts)
import fs from 'node:fs';
import path from 'node:path';

const raiz = path.resolve(import.meta.dirname, '..');
const originales = path.join(raiz, 'juez', 'originales');
const src = path.join(raiz, 'app', 'src');

const puerto = process.env.PORT || 3000;

// Si el servidor está corriendo, él mismo reinicia (así no vuelve a escribir el estado viejo).
let respuesta = null;
try { respuesta = await fetch(`http://localhost:${puerto}/api/reiniciar`, { method: 'POST' }); } catch { /* servidor apagado */ }
if (respuesta && !respuesta.ok) {
  console.error('✘', (await respuesta.json()).error);
  process.exit(1);
}
if (!respuesta) {
  for (const archivo of fs.readdirSync(src)) fs.rmSync(path.join(src, archivo), { recursive: true });
  for (const archivo of fs.readdirSync(originales)) fs.copyFileSync(path.join(originales, archivo), path.join(src, archivo));
  fs.rmSync(path.join(raiz, '.bomba', `estado-${puerto}.json`), { force: true });
}
console.log(`✔ app/src restaurado con los 6 bugs y bomba del puerto ${puerto} en espera`);

if (process.argv.includes('--pruebas')) {
  const tests = path.join(raiz, 'tests');
  for (const archivo of fs.readdirSync(tests)) {
    if (archivo !== 'seed.spec.ts') fs.rmSync(path.join(tests, archivo), { recursive: true, force: true });
  }
  console.log('✔ pruebas borradas (se conservó tests/seed.spec.ts)');
}
