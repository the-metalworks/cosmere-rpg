import { CosmereActor } from '@system/documents/actor';
import { CosmereItem } from '@system/documents/item';

// Types
import { Talent } from '@system/types/item';
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
            // Get the source of the talent
            const source = item.getFlag(
                SYSTEM_ID,
                'source',
            ) as Talent.Source | null;

            // Attempt to find the source on the actor
            let sourceItem = source
                ? item.actor.items.find((item) => {
                      const sourceTypeMatch =
                          (source.type === Talent.SourceType.Ancestry &&
                              item.isAncestry()) ||
                          (source.type === Talent.SourceType.Path &&
                              item.isPath()) ||
                          (source.type === Talent.SourceType.Power &&
                              item.isPower());

                      return sourceTypeMatch && item.system.id === source.id;
                  })
                : undefined;

            // Attempt to find the source through the talent tree
            if (!sourceItem && source?.type === Talent.SourceType.Tree) {
                sourceItem = item.actor.items.find((item) => {
                    return item.isTalentTree() && item.uuid === source.uuid;
                });
            }

            // Attempt to find an item that provides the talent
            if (!sourceItem) {
                for (const otherItem of item.actor.items) {
                    if (
                        otherItem.isTalentsProvider() &&
                        (await otherItem.system.providesTalent(item))
                    ) {
                        sourceItem = otherItem;
                        break;
                    }
                }
            }

            // Ensure the source item is a talents provider
            if (!sourceItem?.isTalentsProvider()) sourceItem = undefined;

            // Set the source in the flags
            void item.setFlag(
                SYSTEM_ID,
                'source',
                sourceItem
                    ? {
                          type: sourceItem.type,
                          id: sourceItem.system.id,
                          uuid: sourceItem.uuid,
                      }
                    : null,
            );
        } else if (item.isTalentsProvider()) {
            if (item.system.talentTree) {
                // Get all talents from the actor that do not have a source set
                const talentsWithoutSource = item.actor.talents.filter(
                    (talent) => !talent.getFlag(SYSTEM_ID, 'source'),
                );

                // Get all talents provided by the item
                const providedTalents = await item.system.getTalents();

                // For each talent, check if the item provides it
                talentsWithoutSource.map((talent) => {
                    if (
                        providedTalents.some(
                            (providedTalent) =>
                                providedTalent.system.id === talent.system.id,
                        )
                    ) {
                        // Set the source of the talent to this item
                        void talent.setFlag(SYSTEM_ID, 'source', {
                            type: item.type,
                            id: item.system.id,
                            uuid: item.uuid,
                        });
                    }
                });
            }
        }
    },
);

Hooks.on(
    'deleteItem',
    async (item: CosmereItem, options: unknown, userId: string) => {
        if (game.user!.id !== userId) return;
        if (!item.actor) return;

        // If the item is a talent, remove its source
        if (item.isTalentsProvider()) {
            // Get all unlocked talents for this item
            const unlockedTalents = item.system.unlockedTalents;

            // For each talent, remove the source flag
            await Promise.all(
                unlockedTalents.map(async (talent) => {
                    await talent.unsetFlag(SYSTEM_ID, 'source');
                }),
            );
        }
    },
);
