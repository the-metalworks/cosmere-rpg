import { Attribute } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents/item';
import { ConstructorOf } from '@system/types/utils';

import { TalentTree } from '@system/types/item';

// Utils
import * as TalentTreeUtils from '@system/utils/talent-tree';

// Dialogs
import { EditNodePrerequisiteDialog } from '../../dialogs/talent-tree/edit-node-prerequisite';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { TalentTreeItemSheet } from '../../talent-tree-sheet';
import { BaseItemSheetRenderContext } from '../../base';

// NOTE: Must use a type instead of an interface to match `AnyObject` type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    node: TalentTree.TalentNode;
};

export class NodePrerequisitesComponent extends HandlebarsApplicationComponent<
    ConstructorOf<TalentTreeItemSheet>,
    Params
> {
    static TEMPLATE =
        'systems/cosmere-rpg/templates/item/talent-tree/components/prerequisites.hbs';

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

    /* --- Accessors --- */

    public get node() {
        return this.params?.node;
    }

    /* --- Actions --- */

    private static async onCreatePrerequisite(
        this: NodePrerequisitesComponent,
        event: Event,
    ) {
        // Create a new prerequisite
        const newRule: TalentTree.Node.Prerequisite = {
            id: foundry.utils.randomID(),
            type: TalentTree.Node.Prerequisite.Type.Attribute,
            attribute: Attribute.Strength,
            value: 1,
            managed: false,
        };

        // Add the new rule to the item
        await this.application.item.update({
            [`system.prerequisites.${newRule.id}`]: newRule,
        });

        // Show the edit dialog
        await EditNodePrerequisiteDialog.show(
            this.application.item,
            this.node!,
            newRule,
        );
    }

    private static onEditPrerequisite(
        this: NodePrerequisitesComponent,
        event: Event,
    ) {
        // Get the rule ID
        const id = this.getRuleIdFromEvent(event);
        if (!id) return;

        // Get the rule data
        const rule = this.node!.prerequisites.get(id);
        if (!rule) return;

        // Ensure rule isn't managed
        if (rule.managed) return;

        // Show the edit dialog
        void EditNodePrerequisiteDialog.show(
            this.application.item,
            this.node!,
            rule,
        );
    }

    private static onDeletePrerequisite(
        this: NodePrerequisitesComponent,
        event: Event,
    ) {
        // Get the rule ID
        const id = this.getRuleIdFromEvent(event);
        if (!id) return;

        // Get the rule data
        const rule = this.node!.prerequisites.get(id);
        if (!rule) return;

        // Ensure rule isn't managed
        if (rule.managed) return;

        // Update the item
        void TalentTreeUtils.removePrerequisite(
            this.node!,
            id,
            this.application.item,
        );
    }

    /* --- Context --- */

    public async _prepareContext(
        params: Params,
        context: BaseItemSheetRenderContext,
    ) {
        return {
            ...context,
            ...(await this.preparePrerequisitesContext()),
        };
    }

    private async preparePrerequisitesContext() {
        // Get the prerequisites type select options
        const prerequisiteTypeSelectOptions =
            this.getPrerequisiteTypeSelectOptions();

        return {
            prerequisites: await Promise.all(
                this.node!.prerequisites.map(
                    this.preparePrerequisiteRuleContext.bind(this),
                ),
            ),
            prerequisiteTypeSelectOptions,
        };
    }

    private async preparePrerequisiteRuleContext(
        rule: TalentTree.Node.Prerequisite,
    ) {
        const prerequisiteTypeSelectOptions =
            this.getPrerequisiteTypeSelectOptions();

        return {
            ...rule,
            typeLabel: prerequisiteTypeSelectOptions[rule.type],

            ...(rule.type === TalentTree.Node.Prerequisite.Type.Talent
                ? {
                      talents: await Promise.all(
                          rule.talents.map(this.prepareRefContext.bind(this)),
                      ),
                  }
                : {}),

            ...(rule.type === TalentTree.Node.Prerequisite.Type.Goal
                ? {
                      goals: await Promise.all(
                          rule.goals.map(this.prepareRefContext.bind(this)),
                      ),
                  }
                : {}),

            ...(rule.type === TalentTree.Node.Prerequisite.Type.Ancestry
                ? {
                      ancestry: await this.prepareRefContext(rule.ancestry),
                  }
                : {}),

            ...(rule.type === TalentTree.Node.Prerequisite.Type.Culture
                ? {
                      culture: await this.prepareRefContext(rule.culture),
                  }
                : {}),
        };
    }

    private async prepareRefContext(ref: TalentTree.Node.Prerequisite.ItemRef) {
        if (!ref) return ref;

        // Look up doc
        const doc = (await fromUuid(ref.uuid)) as unknown as CosmereItem;

        return {
            ...ref,
            link: doc.toAnchor().outerHTML,
        };
    }

    /* --- Helpers --- */

    private getRuleIdFromEvent(event: Event) {
        // Find rule element
        const rule = $(event.currentTarget!).closest('.rule[data-id]');
        return rule.data('id') as string | undefined;
    }

    private getPrerequisiteTypeSelectOptions() {
        return (
            this.application.item.system.schema.getField(
                'nodes._.prerequisites._.type',
            ) as foundry.data.fields.StringField
        ).choices as Record<string, string>;
    }
}

// Register the component
NodePrerequisitesComponent.register('app-talent-tree-node-prerequisites');
