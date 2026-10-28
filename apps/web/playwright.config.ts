import { defineConfig, devices } from '@playwright/test';
const testDatabase = process.env.TEST_DATABASE_URL;
if (!testDatabase || !/^brewlite_test(?:_[a-z0-9]+)?$/.test(new URL(testDatabase).pathname.slice(1))) throw new Error('E2E requires a separate TEST_DATABASE_URL database named brewlite_test');
export default defineConfig({
  testDir: '../../tests/e2e', fullyParallel: false, workers: 1, retries: 0,
  reporter: 'list', use: { baseURL: 'http://127.0.0.1:3105', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chromium' } }],
  webServer: [
    { command: 'npm --prefix ../api run start:prod', url: 'http://127.0.0.1:4105/health', reuseExistingServer: false, env: { DATABASE_URL: testDatabase, PORT: '4105', CORS_ORIGINS: 'http://127.0.0.1:3105', JWT_SECRET: 'e2e-only-secret-at-least-32-characters' } },
    { command: 'npm run start -- --hostname 127.0.0.1 --port 3105', url: 'http://127.0.0.1:3105', reuseExistingServer: false },
  ],
});