// Types
import { AnyObject } from '@system/types/utils';

// Constants
import { SYSTEM_ID } from '@system/constants';

// Temporary type to access collection property which is missing in foundry-vtt-types
type AnyCompendiumCollection = CompendiumCollection.Any & {
    id: string;
    metadata: { flags: AnyObject };
};
type AnyCompendium = Compendium.Any & { collection: AnyCompendiumCollection };

// TODO: Resolve typing issue
// @ts-expect-error Due to foundry-vtt-types issue
Hooks.on('renderCompendium', async (compendium: AnyCompendium) => {
    if (
        !foundry.utils.hasProperty(
            compendium.collection.metadata.flags ?? {},
            `${SYSTEM_ID}.defaultSortingMode`,
        )
    )
        return;

    const sortingModes = game.settings.get('core', 'collectionSortingModes');
    if (sortingModes[compendium.collection.id]) return;

    // Get the default sorting mode from the compendium metadata
    const defaultSortingMode = foundry.utils.getProperty(
        compendium.collection.metadata.flags,
        `${SYSTEM_ID}.defaultSortingMode`,
    ) as string;

    // Set the sorting mode for the compendium
    await game.settings.set('core', 'collectionSortingModes', {
        ...sortingModes,
        [compendium.collection.id]: defaultSortingMode,
    });

    // Initialize the compendium collection tree
    compendium.collection.initializeTree();

    // Re-render
    void compendium.render();
});
