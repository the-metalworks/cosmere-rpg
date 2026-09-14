import fs from 'fs';
import path from 'path';
import { extractPack } from '@foundryvtt/foundryvtt-cli';
import * as changeCase from 'change-case';

// Constants
const PACK_SRC = path.join('build', 'packs');
const PACK_DEST = path.join('src', 'packs');

async function extractPacks() {
    const dirs = fs.readdirSync(PACK_SRC, { withFileTypes: true })
        .filter(file => file.isDirectory());

    for (const dir of dirs) {
        const src = path.join(PACK_SRC, dir.name);
        const dest = path.join(PACK_DEST, dir.name);

        // Remove existing pack
        if (fs.existsSync(dest))
            fs.rmSync(dest, { recursive: true });

        console.log(`Extracting pack ${dir.name}`);

        // Extract pack
        await extractPack(src, dest, { recursive: true, log: true, transformEntry: cleanPackEntry });

        // Nest folders
        nestFolders(dir.name);
    }
}

function cleanPackEntry(data) {
    if (data.ownership) data.ownership = { default: 0 };

    delete data._stats?.compendiumSource;
    delete data.flags?.core?.sourceId;

    delete data.flags?.importSource;
    delete data.flags?.exportSource;

    // Remove empty entries in flags
    if (!data.flags) data.flags = {};
    Object.entries(data.flags).forEach(([key, contents]) => {
        if (Object.keys(contents).length === 0) delete data.flags[key];
    });

    // Clear stats
    delete data._stats;
}


function nestFolders(pack) {
    // Get a map of already processed folders
    const folders = fs.readdirSync(path.join(PACK_DEST, pack), { withFileTypes: true, recursive: true })
        .filter(f => f.isDirectory())
        .filter(dir => fs.existsSync(path.join(dir.parentPath, dir.name, '_folder.json')))
        .map(dir => {
            // Read _folder.json
            const folder = JSON.parse(fs.readFileSync(path.join(dir.parentPath, dir.name, '_folder.json'), 'utf8'));

            return {
                name: dir.name,
                path: path.join(dir.parentPath, dir.name),
                id: folder._id,
            };
        })
        .reduce((acc, folder) => {
            acc[folder.id] = folder;
            return acc;
        }, {});

    // Get all entries
    const entries = fs.readdirSync(path.join(PACK_DEST, pack), { withFileTypes: true })
        .filter(f => f.isFile())
        .map(file => {
            const entry = JSON.parse(fs.readFileSync(path.join(PACK_DEST, pack, file.name), 'utf8'));
            return {
                fileName: file.name,
                path: path.join(file.parentPath, file.name),
                ...entry,
            };
        });

    // Keep count of processed entries
    let processedEntries = 0;

    // Process entries
    entries.forEach(entry => {
        // Change name case
        const name = changeCase.kebabCase(entry.name).replace(/[^a-z0-9-]/g, '');

        // Check if entry is a folder
        if (entry._key.startsWith('!folders')) {
            let folderPath;

            // Check if folder has no parent (root folder)
            if (!entry.folder) {
                // Construct path
                folderPath = path.join(PACK_DEST, pack, name);
            } else {
                // Check if parent folder has been processed already
                const parentFolder = folders[entry.folder];
                if (!parentFolder) return;

                // Construct path
                folderPath = path.join(parentFolder.path, name);
            }

            // Create dir
            fs.mkdirSync(folderPath);

            // Remove entry file
            fs.rmSync(entry.path);

            // Write _folder.json
            fs.writeFileSync(path.join(folderPath, '_folder.json'), JSON.stringify({
                ...entry,
                fileName: undefined,
                path: undefined,
            }, null, 4));

            // Increment processed entries
            processedEntries++;
        } else {
            let entryPath;

            // Check if entry has a parent folder
            if (entry.folder) {
                // Check if parent folder has been processed already
                const parentFolder = folders[entry.folder];
                if (!parentFolder) return;

                // Construct path
                entryPath = path.join(parentFolder.path, `${name}.json`);
            } else if (entry.fileName !== `${name}.json`) {
                // Construct path
                entryPath = path.join(PACK_DEST, pack, `${name}.json`);
            }

            if (entryPath) {
                // Remove entry file
                fs.rmSync(entry.path);

                // Write entry
                fs.writeFileSync(entryPath, JSON.stringify({
                    ...entry,
                    fileName: undefined,
                    path: undefined,
                }, null, 4));
            }

            // Increment processed entries
            processedEntries++;
        }
    });

    // If not all entries have been processed, recursively nest folders
    if (processedEntries < entries.length) {
        nestFolders(pack);
    }
}

await extractPacks();
