import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const CONFIG_FILE = 'docker-config.json';

let config;
try {
    config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
} catch {
    console.error(`Error: ${CONFIG_FILE} not found or invalid`);
    process.exit(1);
}

const env = {
    ...process.env,
    FOUNDRY_VERSION: config.foundryVersion,
    QUENCH_MODULE_URL: config.quenchModuleUrl,
};

console.log(`Using Foundry version: ${env.FOUNDRY_VERSION}`);
console.log(`Using Quench module URL: ${env.QUENCH_MODULE_URL}`);

const args = process.argv.slice(2);
execSync(`docker compose -f docker/docker-compose.yml ${args.join(' ')}`, { env, stdio: 'inherit' });