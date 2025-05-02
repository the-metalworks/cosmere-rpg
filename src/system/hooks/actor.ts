import { CosmereActor } from '@system/documents/actor';
import { DeepPartial } from '@system/types/utils';

// Hooks
import { CosmereHooks } from '@system/hooks';

// Constants
import { SYSTEM_ID } from '@system/constants';

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
                            CosmereHooks.PreModeDeactivateItem,
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
                            CosmereHooks.PreModeActivateItem,
                            newModalityItem,
                        ) === false
                    ) {
                        return false;
                    }
                }
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
                     * Hook: modeDeactivateItem
                     */
                    Hooks.callAll<CosmereHooks.ModeDeactivateItem>(
                        CosmereHooks.ModeDeactivateItem,
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
                        CosmereHooks.ModeActivateItem,
                        newModalityItem,
                    );
                }
            }
        }
    },
);
