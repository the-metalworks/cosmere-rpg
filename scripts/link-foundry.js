import fs from 'fs';
import path from 'path';
import process from 'process';
import prompts from 'prompts';

const BUILD_OUTPUT_FOLDER = 'build';
const FOUNDRY_DATA_PATH_VALIDATION_REGEX = /Data$/; // Does the path end in "Data"
const FOUNDRY_EXPECTED_SUBFOLDERS = ['modules', 'systems', 'worlds'];

// Check if OS is windows
const isWin32 = process.platform === 'win32';

// Construct build path
const buildFolderPath = path.join(process.cwd(), BUILD_OUTPUT_FOLDER);

// Ensure build folder exists (current working directory is in project root)
if (!folderExistsAtPath(buildFolderPath)) {
    console.error(
        `Could not find "build" folder. Are you at the root of the project? Make sure to run "npm run build" at least once before linking.`,
    );
    process.exit(1);
}

// Prompt user for foundry data path
const { dataPath } = await prompts({
    type: 'text',
    name: 'dataPath',
    message: 'Enter the path to your Foundry data folder.',
    validate: (value) => {
        if (!FOUNDRY_DATA_PATH_VALIDATION_REGEX.test(value)) {
            return `"${value}" does not look like a valid Foundry data path. Make sure the path ends in "${isWin32 ? '\\' : '/'}Data".`;
        }

        // Resolve the path
        const absolutePath = path.resolve(value);

        // Ensure path exists
        if (!folderExistsAtPath(absolutePath)) {
            return `No folder found at "${absolutePath}".`;
        }

        // Path is valid, but is it Foundry? (check if expected subfolders exist)
        const allSubfoldersExist = FOUNDRY_EXPECTED_SUBFOLDERS.every(
            (subfolder) =>
                folderExistsAtPath(path.join(absolutePath, subfolder)),
        );
        if (!allSubfoldersExist) {
            return `"${absolutePath}" does not look like a valid Foundry data path.`;
        }

        return true;
    },
});

// Construct path to symlink
const symlinkPath = path.resolve(dataPath, 'systems', 'cosmere-rpg');

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
    fs.symlinkSync(buildFolderPath, symlinkPath);
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
    `Successfully created a symlink between ${buildFolderPath} <==> ${symlinkPath}.`,
);

/* --- Helpers --- */

function folderExistsAtPath(value) {
    const stats = fs.statSync(value, { throwIfNoEntry: false });
    return stats && stats.isDirectory();
}
