import { chromium } from 'playwright';
import { writeFileSync, appendFileSync } from 'node:fs';

const FOUNDRY_URL = process.env.FOUNDRY_URL || 'http://localhost:30000';
const REPORT_PATH = process.env.QUENCH_REPORT_PATH || '/data/quench-report.json';
const LOG_PATH = process.env.QUENCH_LOG_PATH || '/data/quench-console.log';
const TEST_TIMEOUT = 900_000;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => {
    const line = `[browser:${msg.type()}] ${msg.text()}`;
    console.log(line);
    appendFileSync(LOG_PATH, line + '\n');
  });
  page.on('pageerror', err => {
    const line = `[browser:exception] ${err.message}`;
    console.error(line);
    appendFileSync(LOG_PATH, line + '\n');
  });
  page.setDefaultTimeout(TEST_TIMEOUT);
  page.setDefaultNavigationTimeout(120_000);

  console.log(`Connecting to Foundry at ${FOUNDRY_URL}...`);
  await page.goto(FOUNDRY_URL, { waitUntil: 'networkidle', timeout: 30_000 });

  // Select Gamemaster user and join the world
  console.log('Joining as Gamemaster...');
  await page.selectOption('select[name="userid"]', { label: 'Gamemaster' });
  await page.click('button[name="join"]');

  // Wait for the game world to fully load
  console.log('Waiting for game world to load...');
  await page.waitForFunction(
    () => typeof globalThis.game !== 'undefined' && globalThis.game.ready === true,
    { timeout: 120_000 },
  );

  // Verify Quench is available
  const quenchAvailable = await page.evaluate(
    () => typeof globalThis.quench !== 'undefined',
  );
  if (!quenchAvailable) {
    throw new Error('Quench module is not available. Is it installed and enabled?');
  }

  // Wait for test batches to be registered (quenchReady fires after game.ready)
  await page.waitForFunction(
    () => globalThis.quench?._testBatches?.size > 0,
    { timeout: 900_000 },
  );
  const batchCount = await page.evaluate(() => globalThis.quench._testBatches.size);
  console.log(`Found ${batchCount} test batch(es). Starting tests...`);

  // Render the Quench app (required for runBatches to work) and start tests
  await page.evaluate(() => {
    quench.app.render({ force: true });
  });
  // Give the app a moment to render
  await page.waitForTimeout(2000);

  // Start the test run with json: true
  await page.evaluate(() => {
    quench.runBatches('**', { json: true });
  });

  // Poll for completion: quench.reports.json is set when the QuenchReporter finishes
  console.log('Waiting for tests to complete...');
  const report = await page.waitForFunction(
    () => globalThis.quench?.reports?.json ?? null,
    { timeout: TEST_TIMEOUT, polling: 1000 },
  ).then(handle => handle.jsonValue());

  // Write report to file
  writeFileSync(REPORT_PATH, report);
  console.log(`Report written to ${REPORT_PATH}`);

  // Parse and print summary
  const results = JSON.parse(report);
  const { stats } = results;
  console.log('');
  console.log('=== Quench Test Results ===');
  console.log(`  Suites:   ${stats.suites}`);
  console.log(`  Tests:    ${stats.tests}`);
  console.log(`  Passes:   ${stats.passes}`);
  console.log(`  Failures: ${stats.failures}`);
  console.log(`  Pending:  ${stats.pending}`);
  console.log(`  Duration: ${stats.duration}ms`);
  console.log('===========================');

  await browser.close();

  if (stats.failures > 0) {
    console.error(`\nFAILED: ${stats.failures} test(s) failed.`);
    process.exit(1);
  }

  console.log('\nAll tests passed!');
}

main().catch((err) => {
  console.error('Quench test runner failed:', err);
  process.exit(1);
});
