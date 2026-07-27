import { execSync } from 'child_process';
import { createInterface } from 'readline';
import { getDockerConfig } from './docker-utils.js';

const COMPOSE_FILE = 'docker/docker-compose.signlicense.yml';

function compose(command) {
    execSync(`docker compose -f ${COMPOSE_FILE} ${command}`, {
        env,
        stdio: 'inherit',
    });
}

function waitForEnter(message) {
    return new Promise((resolve) => {
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        rl.question(message, () => {
            rl.close();
            resolve();
        });
    });
}

const env = getDockerConfig();
console.log('Starting Foundry container...');
compose('up --build -d --wait');

console.log('\nFoundry is running at http://localhost:30000');
await waitForEnter(
    'Press enter on this terminal when you have entered your license key into Foundry: ',
);

console.log('Copying signed license to secrets/license.json...');
compose('cp foundry:/data/Config/license.json secrets/license.json');

console.log('Stopping Foundry container...');
compose('down');

console.log('\nDone! Signed license saved to secrets/license.json.');
