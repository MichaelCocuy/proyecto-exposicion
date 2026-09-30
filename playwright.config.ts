import { defineConfig, devices } from '@playwright/test';

// PORT permite que cada equipo pruebe su propia copia (agente en 3000, desarrolladores en 3001).
const PORT = process.env.PORT ?? '3000';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node server.js',
    url: `http://localhost:${PORT}/api/estado`,
    env: { PORT },
    reuseExistingServer: true,
  },
  // Un solo navegador para que la suite sea rápida durante los 10 minutos de la demo.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
