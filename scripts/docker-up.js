import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { getDockerConfig } from './docker-utils.js';

const LICENSE_FILE = 'secrets/license.json';

const args = process.argv.slice(2);

// Bringing the container up requires a signed license file.
if (args.includes('up') && !existsSync(LICENSE_FILE)) {
    console.error(
        `Error: ${LICENSE_FILE} not found.\n` +
            `Run "npm run docker:signlicense" to generate a signed license file.`,
    );
    process.exit(1);
}

const env = getDockerConfig();

execSync(`docker compose -f docker/docker-compose.yml ${args.join(' ')}`, {
    env,
    stdio: 'inherit',
});