import { RawActorData, RawDocumentData } from '@src/system/types/utils';
import {
    fixInvalidDocument as fixDocumentIfInvalid,
    getPossiblyInvalidDocument,
    getRawDocumentSources,
} from '../../data';
import { CosmereActor, CosmereItem } from '@src/system/documents';
import { handleDocumentMigrationError } from '../utils';

export default {
    from: '1.0',
    to: '1.1',
    execute: async (packID?: string) => {
        let compendium:
            | CompendiumCollection<CompendiumCollection.DocumentName>
            | undefined;
        if (packID) {
            compendium = game.packs?.get(packID);
        }

        /**
         * Items
         */
        if (!compendium || compendium.documentName === 'Item') {
            const items = await getRawDocumentSources('Item', packID);
            await migrateItems(items, compendium);
        }

        /**
         * Embedded Items
         */
        if (!compendium || compendium.documentName === 'Actor') {
            const actors: RawActorData[] = await getRawDocumentSources(
                'Actor',
                packID,
            );
            await migrateEmbeddedItems(actors, compendium);
        }
    },
};

/**
 * Helpers
 */

// NOTE: Use any here as we're dealing with raw actor data
/* eslint-disable @typescript-eslint/no-explicit-any */
async function migrateItems(
    items: RawDocumentData<any>[],
    compendium?: CompendiumCollection<CompendiumCollection.DocumentName>,
) {
    for (const item of items) {
        try {
            const changes = {};

            migrateItemData(item, changes);

            // Skip the write entirely if nothing changed
            if (Object.keys(changes).length === 0) continue;

            const document = await getPossiblyInvalidDocument<CosmereItem>(
                'Item',
                item._id,
                compendium,
            );

            document.updateSource(changes);
            await document.update(changes, { diff: false });

            fixDocumentIfInvalid('Item', document, compendium);
        } catch (err: unknown) {
            handleDocumentMigrationError(err, 'Item', item);
        }
    }
}

async function migrateEmbeddedItems(
    actors: RawActorData[],
    compendium?: CompendiumCollection<CompendiumCollection.DocumentName>,
) {
    for (const actor of actors) {
        if (actor.items.length === 0) continue;

        try {
            const changes: object[] = [];
            for (const item of actor.items) {
                const itemChanges: Record<string, unknown> = { _id: item._id };
                migrateItemData(item, itemChanges);

                // Only push when more than the _id was set
                if (Object.keys(itemChanges).length > 1) {
                    changes.push(itemChanges);
                }
            }

            if (changes.length === 0) continue;

            const document = await getPossiblyInvalidDocument<CosmereActor>(
                'Actor',
                actor._id,
                compendium,
            );

            await document.updateEmbeddedDocuments('Item', changes);
        } catch (err: unknown) {
            handleDocumentMigrationError(err, 'Actor', actor);
        }
    }
}

function migrateItemData(item: RawDocumentData<any>, changes: object) {
    if (item.type !== 'talent') return;

    const deletions: Record<string, null> = {};
    for (const key of ['path', 'ancestry', 'power'] as const) {
        if (key in item.system) deletions[`system.-=${key}`] = null;
    }

    if (Object.keys(deletions).length > 0) {
        foundry.utils.mergeObject(changes, deletions);
    }
}
