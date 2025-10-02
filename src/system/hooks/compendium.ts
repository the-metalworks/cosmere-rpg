// Types
import { AnyObject } from '@system/types/utils';

// Constants
import { SYSTEM_ID } from '@system/constants';

// TODO: Resolve typing issue
// NOTE: Use any as workaround for foundry-vtt-types issues
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
Hooks.on('renderCompendium', async (compendium: any) => {
    if (
        !foundry.utils.hasProperty(
            compendium.collection.metadata.flags ?? {},
            `${SYSTEM_ID}.defaultSortingMode`,
        )
    )
        return;

    const sortingModes = game.settings.get('core', 'collectionSortingModes');
    if (sortingModes[compendium.metadata.id]) return;

    // Get the default sorting mode from the compendium metadata
    const defaultSortingMode = foundry.utils.getProperty(
        compendium.collection.metadata.flags,
        `${SYSTEM_ID}.defaultSortingMode`,
    ) as string;

    // Set the sorting mode for the compendium
    await game.settings.set('core', 'collectionSortingModes', {
        ...sortingModes,
        [compendium.metadata.id]: defaultSortingMode,
    });

    // Initialize the compendium collection tree
    compendium.collection.initializeTree();

    // Re-render
    compendium.render();
});
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
