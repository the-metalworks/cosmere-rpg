import fs from 'fs';
import child_process from 'child_process';

import archiver from 'archiver';

// Constants
const BUILD_DIR = 'build';

// Check for filename from input (optional)
let filename = process.argv[2];

// Get latest tag from git
if (!filename) {
    const tag = child_process.execSync('git describe --tags --abbrev=0').toString().trim();
    
    console.log(`Creating zip for tag: ${tag}`);

    // Set filename
    filename = `cosmere-rpg-${tag}.zip`;
}

// Create a file to stream archive data to
const output = fs.createWriteStream(filename);

// Create a new archive
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
});

// pipe archive data to the file
archive.pipe(output);

// Add files to the archive
archive.directory(BUILD_DIR, false);

console.log(`Writing zip file to: ${output.path}`);

// Finalize the archive
archive.finalize();