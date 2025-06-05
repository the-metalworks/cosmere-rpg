import { RawDocumentData } from '@src/system/types/utils';
import {
    fixInvalidDocument as fixDocumentIfInvalid,
    getPossiblyInvalidDocument,
    getRawDocumentSources,
} from '../../data';
import { CosmereItem } from '@src/system/documents';
import { handleDocumentMigrationError } from '../utils';

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

                /**
                 * Activation
                 */
                if ('activation' in item.system) {
                    /* --- Consumption Options --- */
                    if (
                        'consume' in item.system.activation &&
                        !Array.isArray(item.system.activation.consume)
                    ) {
                        foundry.utils.mergeObject(changes, {
                            ['system.activation.consume']: item.system
                                .activation.consume
                                ? [item.system.activation.consume]
                                : [],
                        });
                    }
                }

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
