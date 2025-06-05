import {
    AnyObject,
    RawActorData,
    RawDocumentData,
} from '@src/system/types/utils';
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
    execute: async (packID?: string) => {
        // Get relevant compendium, if any
        let compendium:
            | CompendiumCollection<CompendiumCollection.Metadata>
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
            const actors: RawActorData[] = await getRawDocumentSources('Actor');
            await migrateEmbeddedItems(actors, compendium);
        }
    },
};

/**
 * Helpers
 */

// NOTE: Use any here as we're dealing with raw actor data
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
async function migrateItems(
    items: RawDocumentData<any>[],
    compendium?: CompendiumCollection<CompendiumCollection.Metadata>,
) {
    console.log('Migrating items', items);

    await Promise.all(
        items.map(async (item) => {
            try {
                const changes = {};

                migrateItemData(item, changes);

                // Retrieve document
                const document = await getPossiblyInvalidDocument<CosmereItem>(
                    'Item',
                    item._id,
                    compendium,
                );

                // Apply changes
                document.updateSource(changes, { diff: false });
                await document.update(changes, { diff: false });

                // Ensure invalid documents are properly instantiated
                fixDocumentIfInvalid('Item', document, compendium);
            } catch (err: unknown) {
                handleDocumentMigrationError(err, 'Item', item);
            }
        }),
    );
}

async function migrateEmbeddedItems(
    actors: RawActorData[],
    compendium?: CompendiumCollection<CompendiumCollection.Metadata>,
) {
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
                const document = await getPossiblyInvalidDocument<CosmereActor>(
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
        if ('consume' in item.system.activation) {
            // Consumption options can be fully migrated, not migrated
            // at all, or in a halfway state (array, but not a number range).
            // Use AnyObject here to allow us to catch all three cases.
            const consumptionToMigrate: AnyObject[] = Array.isArray(
                item.system.activation.consume,
            )
                ? (item.system.activation.consume as AnyObject[])
                : [];

            const newConsumption = consumptionToMigrate.map(
                (consume) =>
                    ({
                        type: consume.type as ItemConsumeType,
                        value:
                            'min' in (consume.value as AnyObject)
                                ? consume.value // Ignore already migrated data
                                : {
                                      min: consume.value as number,
                                      max: consume.value as number,
                                  },
                    }) as ItemConsumeData,
            );

            foundry.utils.mergeObject(changes, {
                ['system.activation.consume']: newConsumption,
            });
        }
    }
}
