# Testing Framework

The Testing Framework provides several layers of testing:
1. UI end-to-end (e2e) testing with Playwright
2. Foundry functional testing with Quench
3. Rapid, repeatable, automated testing with Docker

## TL;DR

If you have:
1. local foundry server running at http://localhost:30000/ with a game system build...
  a. npm run test:all
2. or use docker...
  a. npm run docker:test:up
  b. npm run test:all
  c. npm run docker:test:down

## Docker

The `docker` folder contains compose files that pull the `felddy/foundryvtt:13` image and use the credentials stored in `.env` to obtain the FoundryVTT licensed runtime for the container.

### Credentials file (.env)

Before the first time trying to spin up the docker image, copy `.env.example` to `.env` (note that `.env` is listed in the `.gitignore` file - please be very careful to not accidentally commit any secrets or sensitive information to the Git repository.)

### Spinning up and down

Run `npm run docker:test:up` to start the docker container. This will also go through the system build process so that the system `build` folder is available to mount to the docker container.

While up, the Playwright tests can be run (see below) and the FoundryVTT system is available at `localhost:3000` with the game system loaded and a small test game world created.

Once up, the container can be spun down with `npm run docker:test:down`.

## Playwright

Playwright is an end-to-end test framework. Tests can be written in `describe - it - expect` style. (They can also be written in BDD/Gherkin style - see *_BDD_* section below.) Playwright abstracts the application "page" and a combination of `fixtures` and `page-objects` help keep tests succinct.

### The Playwright test results

Playwright captures a rich collection of information about each test run.
`npx playwright show-report` will spin up a local web server and pop up a new browser window to view that information.
If there are any test failures, Playwright will run `show-report` by default.

### Selecting specific tests to run

`npm run test:all` runs `npx playwright test`, which includes all tests. You can select specific tests or patterns with `npx playwright test -g Actor`, which will find and run all tests with "Actor" in the test name.

### BDD (possible future support for Behavior-Driven Development)

BDD is a paradigm of test-driven development that features a particular style of test that uses the so-called "Gherkin" language. 
A package exists `playwright-bdd` that directly supports gherkin tests. I did a very short experiment with it and it seemed to work well, but complicates the test tool chain slightly and may not add sufficient benefit for the team. Feedback welcome. 

## Quench

Quench is a FoundryVTT module that provides a test running dialog right in your world. Tests written for the Quench module are regular Mocha/Chai `describe - it - expect` tests.
Since these tests run in the browser in the game world, test code has direct access to all the game, system, and module objects in the game world.

Since Quench tests are built and packaged along with the game system code, they are written in Typescript and can use any types available in the game system.

### Running Quench tests

There are two ways to run Quench tests: with the in-game Quench module dialog; and via the Playwright `quench-runner`.

Running Quench tests manually in-game is as simple as launching the game, installing and enabling the Quench module, opening the Quench dialog, selecting tests and clicking `Run`.

Playwright also runs the Quench tests by default. The `quench-runner` "test" programmatically injects the javascript into the browser to setup a listener for the QuenchReports event, starts the test batch, and collects the test report. There is a small bug in Quench: when starting the test batch, Quench attempts to disable buttons on the Quench dialog. If that dialog is not visible, the resulting undefineds corrupts the Quench internal state, making re-running tests impossible.

## Where to create tests

New Quench tests should live under `src/tests/quench` and will be run with the `quench-runner` (or manually in-game with the Quench module).
New Playwright tests should live under `src/tests/e2e` and will be run by `npx playwright`.

## How I created this framework with Claude's help

(Note: No BW or MW proprietary information was submitted to any LLM.)

I used Claude Code to create this framework by making a shallow copy of the `cosmere-rpg` repo copying only the toolchain code, `src/system.json`, `src/global.d.ts`, `src/style.scss`,f and `src/index.ts`. Then I would copy changes from the Claude folder into the `cosmere-rpg` folder. The entire source tree that Claude saw for this exercise is listed here:
```
claude-fvtt-docker-quench:
build          docker     lint-staged-config.mjs  package.json     src
commitlint.config.js  eslint.config.mjs  package-lock.json   rollup.config.js  tsconfig.json

./build:
patch-notes.html  release-notes.html  system.json

./src:
  assets        global.d.ts  lang   patch-notes.md    style       system       templates
  declarations  index.ts     packs  release-notes.md  style.scss  system.json

./src/assets: (empty)
./src/declarations: (empty)
./src/lang: (empty)
./src/packs: (empty)
./src/style: (empty)
./src/system: (empty)
./src/templates: (empty)
```

Adding Docker, Quench, and Playwright test setup for FoundryVTT development:
- Docker Setup Base Infrastructure:
  * Use Docker Compose with a FoundryVTT container (felddy/foundryvtt image works well)
  * Mount your system/module as a volume into the container's Data directory
  * Configure environment variables for license key and admin password
  * Consider adding Caddy or nginx for SSL in production deployments
- Testing-Specific Configuration:
  * Create a separate docker-compose file for testing (docker-compose.test.yml)
  * Use a clean data directory for tests to avoid pollution
  * Configure headless mode for CI/CD environments
  * Map ports consistently (default 30000)
- Quench Setup (In-Browser Testing) Installation:
  * Add quench as a dependency or module dependency in your system
  * Configure Quench to auto-register your test suites
- Structure:
  * Organize tests by feature/component (e.g., tests/actors/, tests/items/)
  * Use Quench's batching system for test organization
  * Write unit tests for data models, calculations, and utility functions
  * Test Actor/Item class methods without requiring full document instantiation where possible
- Key Patterns:
  * Use hooks to initialize test data
  * Clean up test actors/items after each suite
  * Mock or stub Foundry API calls when appropriate
  * Test document preparation, derived data, and formula calculations
- Playwright Setup (E2E Testing) Configuration:
  * Install @playwright/test and configure playwright.config.ts
  * Set base URL to your Docker container (http://localhost:30000)
  * Configure browser contexts with proper viewport sizes
  * Use headed mode during development, headless in CI
- Multi-Window Handling:
  * This is critical for FoundryVTT testing (character sheets, apps, popups)
  * Use Playwright's multi-page context handling
  * Track opened windows/popups explicitly
  * Wait for specific page URLs or titles to identify windows
- Test Structure:
  * Setup fixtures for logging in as GM
  * Create world setup scripts that run before tests
  * Use page object models for common UI interactions
  * Test complete user workflows (character creation, combat, rolls, etc.)
- Integration Strategy Workflow:
  1. Quench for fast unit/integration tests of your system's logic
  2. Playwright for full E2E workflows that require UI interaction
  3. Docker provides consistent environment for both
- CI/CD Pipeline:
  * bash
  * we'll add the GH workflow later
    # Start FoundryVTT container docker-compose -f docker-compose.test.yml up -d
    # Wait for FoundryVTT to be ready
    # Run Quench tests (via Playwright navigating to Quench UI)
    # Run Playwright E2E tests
    # Tear down docker-compose -f docker-compose.test.yml down
- TypeScript Considerations:
  * Configure proper type definitions for Foundry API
  * Use @league-of-foundry-developers/foundry-vtt-types
  * May need separate tsconfig for tests vs. source code
  * Handle Quench type definitions (might need custom .d.ts)
- Key Challenges You've Solved:
  * Multi-window popup handling in Playwright (Cypress couldn't do this)
  * TypeScript compilation issues with test frameworks
  * Proper isolation between test runs
  * Docker volume mounting for rapid iteration

This setup gives you comprehensive test coverage before major migrations (like rollup→Vite or Handlebars→Svelte) and ensures system stability.
