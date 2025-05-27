import { RawActorData, RawDocumentData } from '@src/system/types/utils';
import {
    fixInvalidDocument as fixDocumentIfInvalid,
    getPossiblyInvalidDocument,
    getRawDocumentSources,
} from '../../data';
import { CosmereActor, CosmereItem } from '@src/system/documents';
import { handleDocumentMigrationError } from '../utils';
import { ItemConsumeData } from '@src/system/data/item/mixins/activatable';
import { ItemConsumeType } from '@src/system/types/cosmere';

export default {
    from: '0.3',
    to: '1.0',
    execute: async () => {
        /**
         * Items
         */
        const items = await getRawDocumentSources('Item');
        await migrateItems(items);

        /**
         * Embedded Items
         */
        const actors = await getRawDocumentSources('Actor');
        await migrateEmbeddedItems(actors as RawActorData[]);
    },
};

/**
 * Helpers
 */

// NOTE: Use any here as we're dealing with raw actor data
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
async function migrateItems(items: RawDocumentData<any>[]) {
    console.log('Migrating items', items);

    await Promise.all(
        items.map(async (item) => {
            try {
                const changes = {};

                migrateItemData(item, changes);

                // Retrieve document
                const document = getPossiblyInvalidDocument<CosmereItem>(
                    'Item',
                    item._id,
                );

                // Apply changes
                document.updateSource(changes, { diff: false });
                await document.update(changes, { diff: false });

                // Ensure invalid documents are properly instantiated
                fixDocumentIfInvalid('Item', document);
            } catch (err: unknown) {
                handleDocumentMigrationError(err, 'Item', item);
            }
        }),
    );
}

async function migrateEmbeddedItems(actors: RawActorData[]) {
    await Promise.all(
        actors.map(async (actor) => {
            if (actor.items.length === 0) return;
            console.log('Migrating embedded items', actor.items);

            try {
                const changes: object[] = [];
                for (const item of actor.items) {
                    const itemChanges = { _id: item._id };
                    migrateItemData(item, itemChanges);

                    changes.push(itemChanges);
                }

                // Retrieve document
                const document = getPossiblyInvalidDocument<CosmereActor>(
                    'Actor',
                    actor._id,
                );

                // Apply changes
                await document.updateEmbeddedDocuments('Item', changes);
            } catch (err: unknown) {
                handleDocumentMigrationError(err, 'Actor', actor);
            }
        }),
    );
}

function migrateItemData(item: RawDocumentData<any>, changes: object) {
    /**
     * Activation
     */
    if ('activation' in item.system) {
        /* --- Consumption Options --- */
        if (
            'consume' in item.system.activation &&
            !Array.isArray(item.system.activation.consume)
        ) {
            const newConsumption: ItemConsumeData[] = [];

            if (item.system.activation.consume) {
                newConsumption.push({
                    type: item.system.activation.consume
                        .type as ItemConsumeType,
                    value: {
                        min: item.system.activation.consume.value as number,
                        max: item.system.activation.consume.value as number,
                    },
                } as ItemConsumeData);
            }

            foundry.utils.mergeObject(changes, {
                ['system.activation.consume']: newConsumption,
            });
        }
    }
}
