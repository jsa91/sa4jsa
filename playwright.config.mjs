import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './website/tests',
  testMatch: '**/*.spec.mjs',
  fullyParallel: true,
  workers: 2,
  use: { viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure' },
  projects: ['chromium', 'firefox'].flatMap((browserName) => [
    { name: `${browserName}-root`, use: { browserName, baseURL: 'http://localhost:4173/' } },
    { name: `${browserName}-subdirectory`, use: { browserName, baseURL: 'http://localhost:4174/lecture/' } },
  ]),
  webServer: [
    { command: 'npm run build && npm run preview', url: 'http://localhost:4173/', reuseExistingServer: false },
    { command: 'npm run preview', env: { PORT: '4174', BASE_PATH: '/lecture/' }, url: 'http://localhost:4174/lecture/', reuseExistingServer: false },
  ],
});
