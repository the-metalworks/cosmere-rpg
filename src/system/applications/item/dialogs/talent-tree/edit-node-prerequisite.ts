import { Attribute, Skill } from '@system/types/cosmere';
import { TalentTreeItem, CosmereItem } from '@system/documents/item';
import { TalentTree } from '@system/types/item';
import { AnyObject } from '@system/types/utils';
import { TalentItemData } from '@system/data/item/talent';

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
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
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
        },
    );

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
        if (this.data.type === TalentTree.Node.Prerequisite.Type.Talent) {
            // Get the old prerequisite state
            const old = this.node.prerequisites.get(this.data.id);

            // Get previous talents
            const prevTalents =
                old?.type === TalentTree.Node.Prerequisite.Type.Talent
                    ? Array.from(old.talents.keys())
                    : [];

            // Figure out which talents have been removed
            const removedTalents = prevTalents.filter(
                (id) =>
                    !(
                        this.data as TalentTree.Node.TalentPrerequisite
                    ).talents.has(id),
            );

            void this.tree.update({
                [`system.nodes.${this.node.id}.prerequisites.${this.data.id}`]:
                    this.data,
                [`system.nodes.${this.node.id}.prerequisites.${this.data.id}.talents`]:
                    this.data.talents.toJSON(),

                // Add removals
                ...removedTalents.reduce(
                    (acc, id) => ({
                        ...acc,
                        [`system.nodes.${this.node.id}.prerequisites.${this.data.id}.talents.-=${id}`]:
                            {},
                    }),
                    {},
                ),
            });
        } else if (this.data.type === TalentTree.Node.Prerequisite.Type.Goal) {
            // Get the old prerequisite state
            const old = this.node.prerequisites.get(this.data.id);

            // Get previous goals
            const prevGoals =
                old?.type === TalentTree.Node.Prerequisite.Type.Goal
                    ? Array.from(old.goals.keys())
                    : [];

            // Figure out which goals have been removed
            const removedGoals = prevGoals.filter(
                (id) =>
                    !(this.data as TalentTree.Node.GoalPrerequisite).goals.has(
                        id,
                    ),
            );

            void this.tree.update({
                [`system.nodes.${this.node.id}.prerequisites.${this.data.id}`]:
                    this.data,
                [`system.nodes.${this.node.id}.prerequisites.${this.data.id}.goals`]:
                    this.data.goals.toJSON(),

                // Add removals
                ...removedGoals.reduce(
                    (acc, id) => ({
                        ...acc,
                        [`system.nodes.${this.node.id}.prerequisites.${this.data.id}.goals.-=${id}`]:
                            {},
                    }),
                    {},
                ),
            });
        } else {
            if (
                this.data.type ===
                    TalentTree.Node.Prerequisite.Type.Attribute &&
                isNaN(this.data.value)
            ) {
                this.data.value = 1;
            } else if (
                this.data.type === TalentTree.Node.Prerequisite.Type.Skill &&
                isNaN(this.data.rank)
            ) {
                this.data.rank = 1;
            }

            void this.tree.update({
                [`system.nodes.${this.node.id}.prerequisites.${this.data.id}`]:
                    this.data,
            });
        }

        void this.close();
    }

    /* --- Form --- */

    protected static async onFormEvent(
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
            this.data.talents ??= new RecordCollection();
        } else if (this.data.type === TalentTree.Node.Prerequisite.Type.Goal) {
            this.data.goals ??= new RecordCollection();
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
            this.data.type === TalentTree.Node.Prerequisite.Type.Ancestry &&
            formData.has('ancestry')
        ) {
            const ancestryUuid = formData.get('ancestry') as string;
            const ancestry = (await fromUuid(
                ancestryUuid,
            )) as unknown as CosmereItem;

            if (ancestry?.isAncestry()) {
                this.data.ancestry = {
                    uuid: ancestry.uuid,
                    id: ancestry.system.id,
                    label: ancestry.name,
                };
            }
        } else if (
            this.data.type === TalentTree.Node.Prerequisite.Type.Culture &&
            formData.has('culture')
        ) {
            const cultureUuid = formData.get('culture') as string;
            const culture = (await fromUuid(
                cultureUuid,
            )) as unknown as CosmereItem;

            if (culture?.isCulture()) {
                this.data.culture = {
                    uuid: culture.uuid,
                    id: culture.system.id,
                    label: culture.name,
                };
            }
        }

        // Render
        void this.render(true);
    }

    /* --- Lifecycle --- */

    protected _onRender(context: AnyObject, options: AnyObject): void {
        super._onRender(context, options);

        $(this.element).prop('open', true);

        $(this.element)
            .find('app-talent-prerequisite-talent-list')
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
}
