import { Attribute } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents/item';
import { ConstructorOf } from '@system/types/utils';

import { Talent } from '@system/types/item';

// Dialogs
import { EditTalentPrerequisiteDialog } from '../dialogs/edit-talent-prerequisite';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { TalentItemSheet } from '../talent-sheet';
import { BaseItemSheetRenderContext } from '../base';

export class TalentPrerequisitesComponent extends HandlebarsApplicationComponent<
    ConstructorOf<TalentItemSheet>
> {
    static TEMPLATE =
        'systems/cosmere-rpg/templates/item/talent/components/prerequisites.hbs';

    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'create-prerequisite': this.onCreatePrerequisite,
        'edit-prerequisite': this.onEditPrerequisite,
        'delete-prerequisite': this.onDeletePrerequisite,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    private static async onCreatePrerequisite(
        this: TalentPrerequisitesComponent,
        event: Event,
    ) {
        // Create a new prerequisite
        const newRule: Talent.Prerequisite = {
            type: Talent.Prerequisite.Type.Attribute,
            attribute: Attribute.Strength,
            value: 1,
        };

        // Generate a unique ID
        const id = foundry.utils.randomID();

        // Add the new rule to the item
        await this.application.item.update({
            [`system.prerequisites.${id}`]: newRule,
        });

        // Show the edit dialog
        await EditTalentPrerequisiteDialog.show(this.application.item, {
            id,
            ...newRule,
        });
    }

    private static onEditPrerequisite(
        this: TalentPrerequisitesComponent,
        event: Event,
    ) {
        // Get the rule ID
        const id = this.getRuleIdFromEvent(event);
        if (!id) return;

        // Get the rule data
        const rule = this.application.item.system.prerequisites[id];
        if (!rule) return;

        // Show the edit dialog
        void EditTalentPrerequisiteDialog.show(this.application.item, {
            id,
            ...rule,
        });
    }

    private static onDeletePrerequisite(
        this: TalentPrerequisitesComponent,
        event: Event,
    ) {
        // Get the rule ID
        const id = this.getRuleIdFromEvent(event);
        if (!id) return;

        // Update the item
        void this.application.item.update({
            [`system.prerequisites.-=${id}`]: null,
        });
    }

    /* --- Context --- */

    public async _prepareContext(
        params: never,
        context: BaseItemSheetRenderContext,
    ) {
        return {
            ...context,
            ...(await this.preparePrerequisitesContext()),
        };
    }

    private async preparePrerequisitesContext() {
        // Get the prerequisites data
        const {
            prerequisitesArray: prerequisites,
            prerequisiteTypeSelectOptions,
        } = this.application.item.system;

        return {
            prerequisites: await Promise.all(
                prerequisites.map(
                    this.preparePrerequisiteRuleContext.bind(this),
                ),
            ),
            prerequisiteTypeSelectOptions,
        };
    }

    private async preparePrerequisiteRuleContext(rule: Talent.Prerequisite) {
        return {
            ...rule,
            typeLabel:
                this.application.item.system.prerequisiteTypeSelectOptions[
                    rule.type
                ],

            ...(rule.type === Talent.Prerequisite.Type.Talent
                ? {
                      modeLabel:
                          CONFIG.COSMERE.items.talent.prerequisite.modes[
                              rule.mode
                          ],
                      talents: await Promise.all(
                          rule.talents.map(async (ref) => {
                              // Look up doc
                              const doc = (await fromUuid(
                                  ref.uuid,
                              )) as unknown as CosmereItem;

                              return {
                                  ...ref,
                                  link: doc.toAnchor().outerHTML,
                              };
                          }),
                      ),
                  }
                : {}),
        };
    }

    /* --- Helpers --- */

    private getRuleIdFromEvent(event: Event) {
        // Find rule element
        const rule = $(event.currentTarget!).closest('.rule[data-id]');
        return rule.data('id') as string | undefined;
    }
}

// Register the component
TalentPrerequisitesComponent.register('app-talent-prerequisites');
