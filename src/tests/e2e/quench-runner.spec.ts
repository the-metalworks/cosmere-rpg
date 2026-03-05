// Bridges Quench in-browser tests with Playwright's test runner.
// Navigates to the running FoundryVTT instance, opens the Quench UI,
// triggers all test batches, and reports results back to Playwright.
//
// This test requires the system to have been built with INCLUDE_TESTS=true
// and the Quench module to be active in the world.

import { test, expect } from './fixtures/foundry-fixture';
import { dismissTours, joinWorldIfNeeded } from './helpers/foundry-auth';

// Generous timeout: Quench tests may take a while to run all batches
test.setTimeout(120_000);

test('run Quench test batches and collect results', async ({ foundryPage }) => {
    // Wait for Foundry to fully initialize
    await foundryPage.waitForFunction(
        () => typeof game !== 'undefined' && game.ready,
        { timeout: 60000 },
    );

    // Ensure the Quench module is activated in this world
    const quenchActive = await foundryPage.evaluate(() => {
        return game.modules.get('quench')?.active ?? false;
    });

    if (!quenchActive) {
        // Check if the module is installed but not active
        const quenchInstalled = await foundryPage.evaluate(() => {
            return game.modules.has('quench');
        });
        if (!quenchInstalled) {
            test.skip(true, 'Quench module is not installed');
        }

        // Activate the Quench module via the settings API
        await foundryPage.evaluate(async () => {
            const moduleConfig = game.settings.get(
                'core',
                'moduleConfiguration',
            );
            moduleConfig['quench'] = true;
            await game.settings.set(
                'core',
                'moduleConfiguration',
                moduleConfig,
            );
        });

        // Reload to apply module activation (FoundryVTT requires a reload)
        await foundryPage.reload({ waitUntil: 'networkidle' });
        await dismissTours(foundryPage);
        await joinWorldIfNeeded(foundryPage);

        // Wait for Foundry to fully re-initialize after reload
        await foundryPage.waitForFunction(
            () => typeof game !== 'undefined' && game.ready,
            { timeout: 60000 },
        );
    }

    // Verify Quench is now available in the browser context
    const quenchAvailable = await foundryPage.evaluate(() => {
        return typeof quench !== 'undefined';
    });
    test.skip(
        !quenchAvailable,
        'Quench module is not available after activation',
    );

    // Step 1: Set up the result collector in the browser context BEFORE
    // triggering tests, so we don't miss the quenchReports hook event.
    await foundryPage.evaluate(() => {
        window.__quenchResults = null;
        Hooks.once('quenchReports', (data) => {
            const report = JSON.parse(data.json); // type: QuenchJsonReport
            console.log('QuenchReports event fired!', report);
            const failures = [];
            const total = report.stats.tests;
            const passed = report.stats.passes;
            const failed = report.stats.failures;
            for (const f of report.failures) {
                failures.push(f);
            }

            window.__quenchResults = {
                total,
                passed,
                failed,
                failures,
            };
            console.log('Quench Results', window.__quenchResults);
        });
    });

    // Step 2: Open the Quench UI (required — runBatches() references UI elements)
    // TODO: File PR on Quench project to fix runBatches() when UI is not visible
    const quenchResults = foundryPage.locator('#quench-results');
    if (!(await quenchResults.isVisible())) {
        const flaskButton = foundryPage.locator('button.quench-button');
        await flaskButton.waitFor({ state: 'visible', timeout: 10_000 });
        await flaskButton.dispatchEvent('click');
    }
    await quenchResults.waitFor({ state: 'visible', timeout: 10_000 });

    // Step 3: Run all Quench batches programmatically
    await foundryPage.evaluate(() => {
        quench.runBatches();
    });

    // Step 5: Wait for the quenchReports hook to fire and populate results
    await foundryPage.waitForFunction(() => window.__quenchResults !== null, {
        timeout: 90_000,
    });

    // Step 6: Read the collected results from the browser context
    interface QuenchResults {
        total: number;
        passed: number;
        failed: number;
        failures: string[];
    }
    const results = (await foundryPage.evaluate(() => {
        return window.__quenchResults;
    })) as QuenchResults;

    // Report results
    console.log(
        `Quench Results: ${results.passed}/${results.total} passed, ${results.failed} failed`,
    );
    if (results.failures.length > 0) {
        console.log('Failures:');
        for (const f of results.failures) {
            console.log(`  - ${f}`);
        }
    }

    // Assert all tests passed
    expect(
        results.failed,
        `${results.failed} Quench test(s) failed:\n${results.failures.join('\n')}`,
    ).toBe(0);
    expect(results.total).toBeGreaterThan(0);
});
