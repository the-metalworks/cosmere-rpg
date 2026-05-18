import { RawActorData, RawDocumentData } from '@src/system/types/utils';
import { getRawDocumentSources } from '../../data';
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
            await migrateItems(items, packID);
        }

        /**
         * Embedded Items
         */
        if (!compendium || compendium.documentName === 'Actor') {
            const actors: RawActorData[] = await getRawDocumentSources(
                'Actor',
                packID,
            );
            await migrateEmbeddedItems(actors, packID);
        }
    },
};

/**
 * Helpers
 */

// NOTE: Use any here as we're dealing with raw actor data
/* eslint-disable @typescript-eslint/no-explicit-any */
async function migrateItems(items: RawDocumentData<any>[], packID?: string) {
    const updates = collectUpdates(items);
    if (updates.length === 0) return;

    try {
        await dispatchUpdate(updates, { pack: packID });
    } catch (err: unknown) {
        handleDocumentMigrationError(err, 'Item', items[0]);
    }
}

async function migrateEmbeddedItems(actors: RawActorData[], packID?: string) {
    for (const actor of actors) {
        if (actor.items.length === 0) continue;

        const updates = collectUpdates(actor.items);
        if (updates.length === 0) continue;

        try {
            const parentUuid = packID
                ? `Compendium.${packID}.Actor.${actor._id}`
                : `Actor.${actor._id}`;
            await dispatchUpdate(updates, { pack: packID, parentUuid });
        } catch (err: unknown) {
            handleDocumentMigrationError(err, 'Actor', actor);
        }
    }
}

function collectUpdates(items: RawDocumentData<any>[]) {
    const updates: Record<string, unknown>[] = [];
    for (const item of items) {
        const changes: Record<string, unknown> = {};
        migrateItemData(item, changes);
        if (Object.keys(changes).length > 0) {
            updates.push({ _id: item._id, ...changes });
        }
    }
    return updates;
}

// We must bypass Document.update() here: removing fields that are no longer
// declared in the schema is silently stripped client-side by cleanData(),
// even when wrapped in Foundry's `-=key` delete syntax. Going straight to
// the SocketInterface drops the request onto the DB without re-validation.
async function dispatchUpdate(
    updates: Record<string, unknown>[],
    options: { pack?: string; parentUuid?: string },
) {
    const operation: Record<string, unknown> = { updates, diff: false };
    if (options.pack) operation.pack = options.pack;
    if (options.parentUuid) operation.parentUuid = options.parentUuid;

    await foundry.helpers.SocketInterface.dispatch('modifyDocument', {
        type: 'Item',
        action: 'update',
        operation,
    } as any);
}

function migrateItemData(
    item: RawDocumentData<any>,
    changes: Record<string, unknown>,
) {
    if (item.type !== 'talent') return;

    for (const key of ['path', 'ancestry', 'power'] as const) {
        if (key in item.system) {
            changes[`system.-=${key}`] = null;
        }
    }
}
