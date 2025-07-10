import { CosmereActor } from '@system/documents/actor';
import { CosmereItem, TalentsProviderItem } from '@system/documents/item';
import { ItemRelationship } from '@system/data/item/mixins/relationships';

// Types
import { CosmereHooks } from '@system/types/hooks';
import { DeepPartial } from '@system/types/utils';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { HOOKS } from '@system/constants/hooks';

/* --- Modality --- */

Hooks.on(
    'preUpdateActor',
    (actor: CosmereActor, update: DeepPartial<CosmereActor>) => {
        if (foundry.utils.hasProperty(update, `flags.${SYSTEM_ID}.mode`)) {
            const modalityChanges = foundry.utils.getProperty(
                update,
                `flags.${SYSTEM_ID}.mode`,
            ) as Record<string, string>;

            for (const [modality, newMode] of Object.entries(modalityChanges)) {
                // Get current mode
                const currentMode = actor.getMode(modality);

                // Get modality item for the current mode
                const currentModalityItem = actor.items.find(
                    (item) =>
                        item.hasId() &&
                        item.hasModality() &&
                        item.system.modality === modality &&
                        item.system.id === currentMode,
                );

                if (currentModalityItem) {
                    /**
                     * Hook: preDeactivateModality
                     */
                    if (
                        Hooks.call<CosmereHooks.PreModeDeactivateItem>(
                            HOOKS.PRE_MODE_DEACTIVATE_ITEM,
                            currentModalityItem,
                        ) === false
                    ) {
                        return false;
                    }
                }

                // Get modality item for the new mode
                const newModalityItem = actor.items.find(
                    (item) =>
                        item.hasId() &&
                        item.hasModality() &&
                        item.system.modality === modality &&
                        item.system.id === newMode,
                );

                if (newModalityItem) {
                    /**
                     * Hook: preActivateModality
                     */
                    if (
                        Hooks.call<CosmereHooks.PreModeActivateItem>(
                            HOOKS.PRE_MODE_ACTIVATE_ITEM,
                            newModalityItem,
                        ) === false
                    ) {
                        return false;
                    }
                }

                // Store the current mode in flags for later use
                foundry.utils.setProperty(
                    update,
                    `flags.${SYSTEM_ID}.meta.update.mode.${modality}`,
                    currentMode,
                );
            }
        }
    },
);

Hooks.on(
    'updateActor',
    (actor: CosmereActor, update: DeepPartial<CosmereActor>) => {
        if (foundry.utils.hasProperty(update, `flags.${SYSTEM_ID}.mode`)) {
            const modalityChanges = foundry.utils.getProperty(
                update,
                `flags.${SYSTEM_ID}.mode`,
            ) as Record<string, string>;

            for (const [modality, newMode] of Object.entries(modalityChanges)) {
                // Get previous mode
                const prevMode = actor.getFlag(
                    SYSTEM_ID,
                    `meta.update.mode.${modality}`,
                );

                // Get modality item for the current mode
                const currentModalityItem = actor.items.find(
                    (item) =>
                        item.hasId() &&
                        item.hasModality() &&
                        item.system.modality === modality &&
                        item.system.id === prevMode,
                );

                if (currentModalityItem) {
                    /**
                     * Hook: modeDeactivateItem
                     */
                    Hooks.callAll<CosmereHooks.ModeDeactivateItem>(
                        HOOKS.MODE_DEACTIVATE_ITEM,
                        currentModalityItem,
                    );
                }

                // Get modality item for the new mode
                const newModalityItem = actor.items.find(
                    (item) =>
                        item.hasId() &&
                        item.hasModality() &&
                        item.system.modality === modality &&
                        item.system.id === newMode,
                );

                if (newModalityItem) {
                    /**
                     * Hook: modeActivateItem
                     */
                    Hooks.callAll<CosmereHooks.ModeActivateItem>(
                        HOOKS.MODE_ACTIVATE_ITEM,
                        newModalityItem,
                    );
                }
            }
        }
    },
);

Hooks.on(
    'createItem',
    async (item: CosmereItem, options: unknown, userId: string) => {
        if (game.user!.id !== userId) return;
        if (!item.actor) return;

        if (item.isTalent()) {
            const hasParentRelationship = item.hasRelationshipOfType(
                ItemRelationship.Type.Parent,
            );

            if (!hasParentRelationship) {
                // If the item has no parent, find the first item in the actor that provides this talent
                let parentItem: TalentsProviderItem | undefined;
                for (const otherItem of item.actor.items) {
                    if (
                        otherItem.isTalentsProvider() &&
                        (await otherItem.system.providesTalent(item))
                    ) {
                        parentItem = otherItem;
                        break;
                    }
                }

                // Record the relationship with the parent item
                if (parentItem) {
                    await item.addRelationship(
                        parentItem,
                        ItemRelationship.Type.Parent,
                    );
                }
            }
        }
    },
);
