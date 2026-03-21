// Playwright configuration for FoundryVTT E2E tests.
// Expects a running FoundryVTT instance at FOUNDRY_URL (default: http://localhost:30000).
// Run `docker compose -f docker/docker-compose.test.yml up -d --wait` before running tests.

import { defineConfig, devices } from '@playwright/test';

const FOUNDRY_URL = process.env.FOUNDRY_URL ?? 'http://localhost:30000';

export default defineConfig({
    testDir: './src/tests/e2e',

    // Each test gets up to 60 seconds; FoundryVTT can be slow to render sheets
    timeout: 60_000,
    expect: { timeout: 10_000 },

    // FoundryVTT is a single-user server; parallel tests would cause session conflicts
    fullyParallel: false,
    workers: 1,

    // Fail the build on CI if test.only is left in source code
    forbidOnly: !!process.env.CI,

    // Retry once on CI to handle transient Foundry loading issues
    retries: process.env.CI ? 1 : 0,

    reporter: process.env.CI
        ? [['github'], ['html', { open: 'never' }]]
        : [['list'], ['html', { open: 'on-failure' }]],

    use: {
        baseURL: FOUNDRY_URL,
        // FoundryVTT requires minimum 1366x768
        viewport: { width: 1440, height: 900 },
        trace: 'on',
        screenshot: 'on',
        video: 'on',
        // FoundryVTT uses Pixi.js which requires WebGL. Headless Chromium needs an
        // explicit flag to initialize a working WebGL context:
        //   macOS/Windows: --use-angle=default lets ANGLE pick Metal or D3D11
        //   Linux:         --use-gl=swiftshader uses software rendering (no GPU needed,
        //                  safe for CI and dev machines alike)
        launchOptions: {
            args: [
                process.platform === 'linux'
                    ? '--use-gl=swiftshader'
                    : '--use-angle=default',
            ],
        },
    },

    projects: [
        // Authentication setup: logs into FoundryVTT and saves session state
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
        },

        // Main E2E test suite
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json',
                // Override Desktop Chrome's 1280x720 — FoundryVTT requires ≥1366x768
                viewport: { width: 1440, height: 900 },
            },
            dependencies: ['setup'],
        },

        // Quench bridge: triggers in-browser Quench tests via Playwright
        {
            name: 'quench',
            testMatch: /.*quench-runner\.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json',
                viewport: { width: 1440, height: 900 },
            },
            dependencies: ['setup'],
        },
    ],
});
