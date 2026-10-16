import { Attribute, Skill } from '@system/types/cosmere';
import { TalentTreeItem, CosmereItem } from '@system/documents/item';
import { TalentTree } from '@system/types/item';
import { AnyObject } from '@system/types/utils';

import { RecordCollection } from '@system/data/fields/collection';

const { ApplicationV2 } = foundry.applications.api;

import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

export class EditNodePrerequisiteDialog extends ComponentHandlebarsApplicationMixin(
    ApplicationV2<AnyObject>,
) {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = {
        window: {
            title: 'DIALOG.EditTalentPrerequisite.Title',
            minimizable: false,
            resizable: true,
            positioned: true,
        },
        classes: ['dialog', 'edit-talent-prerequisite'],
        tag: 'dialog',
        position: {
            width: 350,
        },
        actions: {
            update: this.onUpdatePrerequisite,
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            form: {
                template:
                    'systems/cosmere-rpg/templates/item/talent-tree/dialogs/edit-prerequisite.hbs',
                forms: {
                    form: {
                        handler: this.onFormEvent,
                        submitOnChange: true,
                    },
                },
            },
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    private constructor(
        private tree: TalentTreeItem,
        private node: TalentTree.TalentNode,
        private data: TalentTree.Node.Prerequisite,
    ) {
        super({
            id: `${tree.uuid}.nodes.${node.id}.Prerequisite.${data.id}`,
        });
    }

    /* --- Statics --- */

    public static async show(
        tree: TalentTreeItem,
        node: TalentTree.TalentNode,
        data: TalentTree.Node.Prerequisite,
    ) {
        // Clone data
        data = foundry.utils.deepClone(data);

        if (data.type === TalentTree.Node.Prerequisite.Type.Talent) {
            data.talents = new RecordCollection(
                Array.from(data.talents.entries()),
            );
        } else if (data.type === TalentTree.Node.Prerequisite.Type.Goal) {
            data.goals = new RecordCollection(Array.from(data.goals.entries()));
        }

        const dialog = new this(tree, node, data);
        await dialog.render(true);
    }

    /* --- Actions --- */

    private static onUpdatePrerequisite(this: EditNodePrerequisiteDialog) {
        if (this.isItemListType()) {
            // Get the old prerequisite state
            const old = this.node.prerequisites.get(this.data.id)!;

            const oldItemList = EditNodePrerequisiteDialog.getItemList(old);
            const newItemList = EditNodePrerequisiteDialog.getItemList(
                this.data,
            )!;

            // Get previous items
            const prevItems =
                old?.type === this.data.type && !!oldItemList
                    ? Array.from(oldItemList.keys())
                    : [];

            // Figure out which items have been removed
            const removedItems = prevItems.filter(
                (id) =>
                    !EditNodePrerequisiteDialog.getItemList(this.data)!.has(id),
            );

            const itemListName = this.itemListVarname!;

            void this.tree.update({
                [`system.nodes.${this.node.id}.prerequisites.${this.data.id}`]:
                    this.data,
                [`system.nodes.${this.node.id}.prerequisites.${this.data.id}.${itemListName}`]:
                    newItemList.toJSON(),

                // Add removals
                ...removedItems.reduce(
                    (acc, id) => ({
                        ...acc,
                        [`system.nodes.${this.node.id}.prerequisites.${this.data.id}.${itemListName}.-=${id}`]:
                            null,
                    }),
                    {},
                ),
            });
        } else {
            const enumAndValueList =
                EditNodePrerequisiteDialog.getEnumAndValueList(this.data);
            if (enumAndValueList) {
                enumAndValueList.forEach((element) => {
                    if (isNaN(element.value)) element.value = 1;
                });
            }

            void this.tree.update({
                [`system.nodes.${this.node.id}.prerequisites.${this.data.id}`]:
                    this.data,
            });
        }

        void this.close();
    }

    /* --- Form --- */

    protected static onFormEvent(
        this: EditNodePrerequisiteDialog,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (event instanceof SubmitEvent) return;

        // Get type
        const type = formData.get('type') as TalentTree.Node.Prerequisite.Type;
        this.data.type = type;

        if (this.data.type === TalentTree.Node.Prerequisite.Type.Attribute) {
            this.data.attribute = (formData.get('attribute') ??
                Object.keys(CONFIG.COSMERE.attributes)[0]) as Attribute;
            this.data.value = parseInt(formData.get('value') as string, 10);
        } else if (this.data.type === TalentTree.Node.Prerequisite.Type.Skill) {
            this.data.skill = (formData.get('skill') ??
                Object.keys(CONFIG.COSMERE.skills)[0]) as Skill;
            this.data.rank = parseInt(formData.get('rank') as string, 10);
        } else if (
            this.data.type === TalentTree.Node.Prerequisite.Type.Talent
        ) {
            this.data.talents ??=
                new RecordCollection<TalentTree.Node.Prerequisite.TalentRef>();
        } else if (this.data.type === TalentTree.Node.Prerequisite.Type.Goal) {
            this.data.goals ??=
                new RecordCollection<TalentTree.Node.Prerequisite.ItemRef>();
        } else if (
            this.data.type === TalentTree.Node.Prerequisite.Type.Connection
        ) {
            this.data.description = formData.get('description') as string;
        } else if (
            this.data.type === TalentTree.Node.Prerequisite.Type.Level &&
            formData.has('level')
        ) {
            this.data.level = parseInt(formData.get('level') as string);
        } else if (
            this.data.type === TalentTree.Node.Prerequisite.Type.Ancestry
        ) {
            this.data.ancestries ??=
                new RecordCollection<TalentTree.Node.Prerequisite.ItemRef>();
        } else if (
            this.data.type === TalentTree.Node.Prerequisite.Type.Culture
        ) {
            this.data.cultures ??=
                new RecordCollection<TalentTree.Node.Prerequisite.ItemRef>();
        } else if (this.data.type === TalentTree.Node.Prerequisite.Type.Power) {
            this.data.powers ??=
                new RecordCollection<TalentTree.Node.Prerequisite.ItemRef>();
        }

        // Render
        void this.render(true);
    }

    /* --- Lifecycle --- */

    protected async _onRender(
        context: AnyObject,
        options: AnyObject,
    ): Promise<void> {
        await super._onRender(context, options);

        $(this.element).prop('open', true);

        $(this.element)
            .find('app-talent-prerequisite-item-list')
            .on('change', () => this.render(true));
    }

    /* --- Context --- */

    public _prepareContext(): Promise<AnyObject> {
        return Promise.resolve({
            editable: true,
            tree: this.tree,
            node: this.node,
            schema: this.tree.system.schema.getField(
                'nodes.model.prerequisites.model',
            ),
            ...this.data,

            typeSelectOptions: this.getPrequisiteTypeSelectOptions(),
            attributeSelectOptions: Object.entries(
                CONFIG.COSMERE.attributes,
            ).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {},
            ),
            skillSelectOptions: Object.entries(CONFIG.COSMERE.skills).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {},
            ),
        });
    }

    /* --- Helpers --- */

    private getPrequisiteTypeSelectOptions() {
        return (
            this.tree.system.schema.getField(
                'nodes.model.prerequisites.model.type',
            ) as foundry.data.fields.StringField
        ).choices as Record<string, string>;
    }

    private isItemListType() {
        switch (this.data.type) {
            case TalentTree.Node.Prerequisite.Type.Ancestry:
            case TalentTree.Node.Prerequisite.Type.Culture:
            case TalentTree.Node.Prerequisite.Type.Goal:
            case TalentTree.Node.Prerequisite.Type.Power:
            case TalentTree.Node.Prerequisite.Type.Talent:
                return true;
            default:
                return false;
        }
    }

    private static getItemList(prereq: TalentTree.Node.Prerequisite) {
        if (!prereq) return undefined;
        switch (prereq.type) {
            case TalentTree.Node.Prerequisite.Type.Ancestry:
                return prereq.ancestries;
            case TalentTree.Node.Prerequisite.Type.Culture:
                return prereq.cultures;
            case TalentTree.Node.Prerequisite.Type.Goal:
                return prereq.goals;
            case TalentTree.Node.Prerequisite.Type.Power:
                return prereq.powers;
            case TalentTree.Node.Prerequisite.Type.Talent:
                return prereq.talents;
            default:
                return undefined;
        }
    }

    private get itemListVarname() {
        switch (this.data.type) {
            case TalentTree.Node.Prerequisite.Type.Ancestry:
                return 'ancestries';
            case TalentTree.Node.Prerequisite.Type.Culture:
                return 'cultures';
            case TalentTree.Node.Prerequisite.Type.Goal:
                return 'goals';
            case TalentTree.Node.Prerequisite.Type.Power:
                return 'powers';
            case TalentTree.Node.Prerequisite.Type.Talent:
                return 'talents';
            default:
                return undefined;
        }
    }
    private static getEnumAndValueList(prereq: TalentTree.Node.Prerequisite) {
        if (!prereq) return undefined;
        switch (prereq.type) {
            case TalentTree.Node.Prerequisite.Type.Attribute:
                return prereq.attributes;
            case TalentTree.Node.Prerequisite.Type.Skill:
                return prereq.skills;
            default:
                return undefined;
        }
    }
}
