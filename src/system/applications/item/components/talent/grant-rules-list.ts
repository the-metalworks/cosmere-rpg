import { Talent } from '@system/types/item';
import { CosmereItem } from '@system/documents/item';
import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Dialogs
import { EditTalentGrantRuleDialog } from '../../dialogs/talent/edit-grant-rule';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { TalentItemSheet } from '../../talent-sheet';
import { BaseItemSheetRenderContext } from '../../base';

export class TalentGrantRulesList extends HandlebarsApplicationComponent<
    ConstructorOf<TalentItemSheet>
> {
    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_TALENT_GRANT_RULES_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'create-rule': this.onCreateGrantRule,
        'edit-rule': this.onEditGrantRule,
        'delete-rule': this.onDeleteGrantRule,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    private static async onCreateGrantRule(this: TalentGrantRulesList) {
        // Create a new rule
        const newRule: Talent.GrantRule = {
            type: Talent.GrantRule.Type.Items,
            items: [],
        };

        // Generate a unique ID
        const id = foundry.utils.randomID();

        // Add the new rule to the item
        await this.application.item.update({
            [`system.grantRules.${id}`]: newRule,
        });

        // Show the edit dialog
        void EditTalentGrantRuleDialog.show(this.application.item, {
            _id: id,
            ...newRule,
        });
    }

    private static onEditGrantRule(this: TalentGrantRulesList, event: Event) {
        // Get id
        const id = $(event.target!).closest('[data-id]').data('id') as
            | string
            | undefined;
        if (!id) return;

        // Get rule
        const rule = this.application.item.system.grantRules.get(id);
        if (!rule) return;

        // Show the edit dialog
        void EditTalentGrantRuleDialog.show(this.application.item, {
            _id: id,
            ...rule,
        });
    }

    private static async onDeleteGrantRule(
        this: TalentGrantRulesList,
        event: Event,
    ) {
        // Get id
        const id = $(event.target!).closest('[data-id]').data('id') as
            | string
            | undefined;
        if (!id) return;

        // Remove the rule
        await this.application.item.update({
            [`system.grantRules.-=${id}`]: null,
        });
    }

    /* --- Context --- */

    public async _prepareContext(
        params: never,
        context: BaseItemSheetRenderContext,
    ) {
        // Get rules
        const rules = this.application.item.system.grantRules;

        return {
            ...context,
            rules: await Promise.all(
                rules.map(this.prepareGrantRuleContext.bind(this)),
            ),
        };
    }

    private async prepareGrantRuleContext(rule: Talent.GrantRule) {
        return {
            ...rule,
            typeLabel: CONFIG.COSMERE.items.talent.grantRules.types[rule.type],

            ...(rule.type === Talent.GrantRule.Type.Items
                ? {
                      items: await Promise.all(
                          rule.items.map(async (itemUUID) => {
                              // Look up the doc
                              const item = (await fromUuid(
                                  itemUUID,
                              )) as unknown as CosmereItem;

                              return {
                                  name: item.name,
                                  uuid: item.uuid,
                                  link: item.toAnchor().outerHTML,
                              };
                          }),
                      ),
                  }
                : {}),
        };
    }
}

// Register the component
TalentGrantRulesList.register('app-talent-grant-rules-list');
