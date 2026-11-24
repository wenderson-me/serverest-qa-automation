import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

if (existsSync('.env')) process.loadEnvFile();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    channel: 'chrome',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.API_URL ?? 'https://serverest.dev',
      },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: {
        baseURL: process.env.FRONT_URL ?? 'https://front.serverest.dev',
      },
    },
  ],
});
