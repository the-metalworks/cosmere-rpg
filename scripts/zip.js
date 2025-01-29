import fs from 'fs';
import child_process from 'child_process';

import archiver from 'archiver';

// Constants
const BUILD_DIR = 'build';

// Check for tag from input (optional)
let tag = process.argv[2];

// Get latest tag from git
if (!tag) {
    tag = child_process.execSync('git describe --tags --abbrev=0').toString().trim();
} else {
    tag = `release-${tag}`;
}

// Create a file to stream archive data to
const output = fs.createWriteStream(
    `cosmere-rpg-${tag}.zip`
);

// Create a new archive
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
});

// pipe archive data to the file
archive.pipe(output);

// Add files to the archive
archive.directory(BUILD_DIR, false);

// Finalize the archive
archive.finalize();