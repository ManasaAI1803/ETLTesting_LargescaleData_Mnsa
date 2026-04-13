import { defineConfig } from '@playwright/test';
import { config } from 'dotenv';

config();

export default defineConfig({
  testDir: './tests/e2e/',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  reporter: 'html',
  globalSetup: require.resolve('./src/global-setup.ts'),
  globalTeardown: require.resolve('./src/global-teardown.ts'),
  use: {
    actionTimeout: 0,
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});