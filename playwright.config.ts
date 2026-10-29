import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run preview --workspace=client',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
});
