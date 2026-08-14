import { execSync } from 'child_process';

function globalTeardown() {
    execSync('npm run docker:down', { stdio: 'inherit' });
}

export default globalTeardown;
