import fs from 'fs';
import path from 'path';
import { compilePack } from '@foundryvtt/foundryvtt-cli';

// Constants
const PACK_SRC = path.join('src', 'packs');
const PACK_DEST = path.join('build', 'packs');

async function compilePacks() {
    const folders = fs
        .readdirSync(PACK_SRC, { withFileTypes: true })
        .filter((file) => file.isDirectory());

    for (const folder of folders) {
        const src = path.join(PACK_SRC, folder.name);
        const dest = path.join(PACK_DEST, folder.name);

        console.log(`Compiling pack ${folder.name}`);
        try {
            await compilePack(src, dest, { recursive: true, log: true });
        } catch (error) {
            // Ignore iterator cleanup errors that occur after successful packing
            // This is a known issue with LevelDB (https://github.com/google/leveldb/issues/1292)
            if (error.code !== 'LEVEL_ITERATOR_NOT_OPEN') {
                throw error;
            }
        }
    }
}

await compilePacks();
