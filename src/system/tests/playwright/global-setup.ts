import { execSync } from 'child_process';
import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    // Shutdown Docker container if one is already running
    execSync('npm run docker:down', { stdio: 'inherit' });
    // Start Docker container and wait for healthcheck to pass
    execSync('npm run docker:up -- --wait', { stdio: 'inherit' });

    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Navigate to FoundryVTT and join as Gamemaster
    await page.goto('http://localhost:30000');
    console.log('Joining as Gamemaster...');
    await page.selectOption('select[name="userid"]', { label: 'Gamemaster' });
    await page.click('button[name="join"]');

    // Save signed-in state so tests can reuse it
    await page
        .context()
        .storageState({ path: './playwright/.auth/state.json' });
    await browser.close();
}

export default globalSetup;
