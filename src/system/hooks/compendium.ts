// Types
import { AnyObject } from '@system/types/utils';

// Constants
import { SYSTEM_ID } from '@system/constants';

interface Metadata extends CompendiumCollection.Metadata {
    flags?: AnyObject;
}

Hooks.on('renderCompendium', async (compendium: Compendium<Metadata>) => {
    if (
        !foundry.utils.hasProperty(
            compendium.collection.metadata.flags ?? {},
            `${SYSTEM_ID}.defaultSortingMode`,
        )
    )
        return;

    const sortingModes = game.settings!.get(
        'core',
        'collectionSortingModes',
    ) as Record<string, string>;
    if (sortingModes[compendium.metadata.id]) return;

    // Get the default sorting mode from the compendium metadata
    const defaultSortingMode = foundry.utils.getProperty(
        compendium.collection.metadata.flags!,
        `${SYSTEM_ID}.defaultSortingMode`,
    ) as string;

    // Set the sorting mode for the compendium
    await game.settings!.set('core', 'collectionSortingModes', {
        ...sortingModes,
        [compendium.metadata.id]: defaultSortingMode,
    });

    // Initialize the compendium collection tree
    compendium.collection.initializeTree();

    // Re-render
    compendium.render();
});
