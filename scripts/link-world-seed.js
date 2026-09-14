import fs from 'fs';
import path from 'path';
import process from 'process';
import prompts from 'prompts';

const WORLD_SEED_EXPECTED_SUBFOLDERS = ['docker', 'scripts', 'world-seed'];

// Set project root
const projectRoot = path.resolve(import.meta.dirname, '..');
process.chdir(projectRoot);

// Check if OS is windows
const isWin32 = process.platform === 'win32';
const expectedPath = "../docker-world-seed";
var dataPath = "";

if(!folderExistsAtPath(expectedPath)){
    // Prompt user for foundry data path
    const { enteredPath } = await prompts({
        type: 'text',
        name: 'enteredPath',
        message: 'Enter the path to your docker-world-seed repo.',
        validate: (value) => {
            // Resolve the path
            const absolutePath = path.resolve(value);

            // Ensure path exists
            if (!folderExistsAtPath(absolutePath)) {
                return `No folder found at "${absolutePath}".`;
            }

            // Path is valid, but is it the world-seed repo? (check if expected subfolders exist)
            const allSubfoldersExist = WORLD_SEED_EXPECTED_SUBFOLDERS.every(
                (subfolder) =>
                    folderExistsAtPath(path.join(absolutePath, subfolder)),
            );
            if (!allSubfoldersExist) {
                return `"${absolutePath}" does not look like a valid docker-world-seed repo.`;
            }

            return true;
        },
    });
    dataPath = enteredPath;
}
else dataPath = expectedPath;


// Construct path to symlink
const symlinkPath = path.resolve(projectRoot, "world-seed");

const stats = fs.statSync(symlinkPath, { throwIfNoEntry: false });
if (stats) {
    const objectAtPath = stats.isFile()
        ? 'file'
        : stats.isDirectory()
          ? 'folder'
          : stats.isSymbolicLink()
            ? 'symlink'
            : '<unknown>';

    const { shouldProceed } = await prompts({
        type: 'confirm',
        name: 'shouldProceed',
        initial: false,
        message: `A ${objectAtPath} already exists at "${symlinkPath}". Replace with new symlink?`,
    });

    if (!shouldProceed) {
        console.log('Aborting.');
        process.exit();
    }

    // Clean up
    if (objectAtPath !== 'symlink') {
        fs.rmSync(symlinkPath, { recursive: true, force: true });
    } else {
        fs.unlinkSync(symlinkPath);
    }
}

try {
    fs.symlinkSync(dataPath, symlinkPath);
} catch (err) {
    if (err.message.includes('EPERM: operation not permitted')) {
        console.error(`Operation not permitted. Try running the script from a privileged user.`)
    } else {
        console.error(
            `An unexpected error occured while trying to create a symlink: ${err.message ?? ''}`,
        );
    }
    process.exit(1);
}

console.log(
    `Successfully created a symlink between ${dataPath} <==> ${symlinkPath}.`,
);

/* --- Helpers --- */

function folderExistsAtPath(value) {
    const stats = fs.statSync(value, { throwIfNoEntry: false });
    return stats && stats.isDirectory();
}
