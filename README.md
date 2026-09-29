# La última cosecha ☕🔪

Juego de misterio web para demostrar que automatizar pruebas con Playwright le gana a probar a mano. Un humano y un agente de IA resuelven el mismo caso, en igualdad de condiciones, y se compara quién encuentra primero al asesino.

## El caso

Don Aurelio Villamizar aparece muerto en la Hacienda La Esmeralda (Salento, Quindío) la noche en que anunció que cambiaría su testamento. Hay seis sospechosos, seis armas y seis lugares. Para resolverlo hay que acusar correctamente quién, con qué arma y dónde. Cada jugador tiene dos acusaciones.

Cada número de caso (`?caso=1000` a `?caso=9999`) genera un culpable, horarios y pistas distintos, siempre con una única solución.

## Qué pone a prueba cada escena

| Escena | Habilidad de automatización |
|---|---|
| Portería | Llenar formularios y hacer login |
| Registro de accesos | Tablas grandes, filtros y paginación |
| Cámara del corredor | Contenido dentro de un iframe |
| Laboratorio forense | Esperas por procesos lentos |
| Estudio | Tooltips que solo aparecen con hover |
| Caja fuerte | Teclado virtual y bloqueo tras fallos |
| Carta sellada | Ventanas emergentes |
| Contestadora | Diálogos modales |
| Diario | Formularios con clave y paginación |
| Acusación | Aserción final: `Caso resuelto ✅` |

Hay trampas a propósito: una confesión falsa oculta en el DOM, coartadas parciales y mensajes que parecen coartadas pero caen fuera de la hora del crimen.

## Cómo correrlo

```bash
npm install
npx playwright install
npm start
```

Abre `http://localhost:3000/?caso=4821&jugador=humano` para el humano. El agente usa la misma URL con `jugador=agente`.

## Con los agentes de Playwright

```bash
npx playwright init-agents --loop=claude
```

La prueba `tests/seed.spec.ts` deja al agente dentro de la hacienda. Desde ahí, el planner investiga, el generator escribe la prueba que resuelve el caso y el healer la repara si el sitio cambia.

Para probar la automatización con otros casos:

```bash
# Linux / macOS
CASO=1234 npx playwright test

# Windows (PowerShell)
$env:CASO=1234; npx playwright test
```

## Reglas de la demo

- Humano y agente usan el mismo número de caso y el mismo cronómetro.
- El agente solo puede investigar a través de la interfaz, sin leer el código fuente.
- El caso se da por resuelto cuando aparece `Caso resuelto ✅`.

## Estructura

```
.
├── .claude/
│   ├── agents/qa-playwright.md        # Agente de QA con Playwright
│   └── skills/                        # Skills que usa el agente
│       ├── qa-test-plan-from-flow/    # Plan de pruebas a partir de un flujo
│       ├── qa-write-spec-from-plan/   # Escribir specs desde un plan aprobado
│       ├── qa-bug-report/             # Reporte de bugs con repro y evidencia
│       └── qa-flaky-triage/           # Diagnóstico de pruebas inestables
├── public/index.html                  # El juego
├── server.js                          # Servidor local (puerto 3000)
├── tests/seed.spec.ts                 # Prueba semilla para el agente
└── playwright.config.ts
```
