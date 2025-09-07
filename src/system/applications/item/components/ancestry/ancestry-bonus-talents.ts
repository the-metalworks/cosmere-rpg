import { AnyObject, ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

import { AncestryItem } from '@system/documents/item';

// Dialogs
import { EditBonusTalentsRuleDialog } from '../../dialogs/talent/edit-bonus-talents-rule';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { AncestrySheet } from '../../ancestry-sheet';

export class AncestryBonusTalentsComponent extends HandlebarsApplicationComponent<
    // typeof AncestrySheet
    any // TEMP: Workaround
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_ANCESTRY_BONUS_TALENTS}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'add-rule': this.onAddRule,
        'edit-rule': this.onEditRule,
        'remove-rule': this.onRemoveRule,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    private static async onAddRule(
        this: AncestryBonusTalentsComponent,
        event: Event,
    ) {
        const item = this.application.item as AncestryItem; // TEMP: Workaround

        // Get bonus talents
        const { bonusTalents } = item.system.advancement;

        // Find the highest level
        const highest = bonusTalents.reduce(
            (acc, rule) => Math.max(acc, rule.level),
            0,
        );

        // Create a new rule
        bonusTalents.push({
            level: highest + 1,
            quantity: 1,
            restrictions: '',
        });

        // Update the item
        await this.application.item.update({
            system: {
                advancement: {
                    bonusTalents
                }
            }
        });

        // Edit the rule
        void this.editRule(bonusTalents.length - 1);
    }

    private static onEditRule(
        this: AncestryBonusTalentsComponent,
        event: Event,
    ) {
        // Get the element
        const el = $(event.currentTarget!).closest('li');

        // Get the index
        const index = Number(el.data('index'));

        // Edit the rule
        void this.editRule(index);
    }

    private static onRemoveRule(
        this: AncestryBonusTalentsComponent,
        event: Event,
    ) {
        if (!this.application.item.isAncestry()) return; // TEMP: Workaround

        // Get the element
        const el = $(event.currentTarget!).closest('li');

        // Get the index
        const index = Number(el.data('index'));

        // Get the bonus talents
        const { bonusTalents } = this.application.item.system.advancement;

        // Remove the rule
        bonusTalents.splice(index, 1);

        // Update the item
        void this.application.item.update({
            system: {
                advancement: {
                    bonusTalents
                }
            }
        });
    }

    /* --- Context --- */

    public _prepareContext(params: never, context: AnyObject) {
        const item = this.application.item as AncestryItem; // TEMP: Workaround

        const levels =
            item.system.advancement.bonusTalents.sort(
                (a, b) => a.level - b.level,
            );

        return Promise.resolve({
            ...context,
            levels,
        });
    }

    /* --- Helpers --- */

    protected async editRule(index: number) {
        const item = this.application.item as AncestryItem; // TEMP: Workaround

        // Get bonus talents
        const { bonusTalents } = item.system.advancement;

        // Get the rule
        const rule = bonusTalents[index];

        const changes = await EditBonusTalentsRuleDialog.show(rule);
        if (changes) {
            if (changes.level !== rule.level) {
                // Ensure no other rule has the same level
                const existing = bonusTalents.find(
                    (r) => r.level === changes.level,
                );

                if (existing) {
                    return ui.notifications.warn(
                        game.i18n!.format(
                            'DIALOG.EditBonusTalentsRule.Warning.DuplicateLevel',
                            {
                                level: changes.level.toFixed(),
                            },
                        ),
                    );
                }
            }

            bonusTalents[index] = changes;
            void this.application.item.update({
                system: {
                    advancement: {
                        bonusTalents
                    }
                }
            });
        }
    }
}

// Register the component
AncestryBonusTalentsComponent.register('app-ancestry-bonus-talents');
