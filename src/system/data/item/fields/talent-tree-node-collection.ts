import { CosmereItem } from '@system/documents';
import { TalentTree } from '@system/types/item';

import {
    CollectionField,
    RecordCollection,
    CollectionFieldOptions,
} from '@system/data/fields';

export class TalentTreeNodeCollectionField extends CollectionField<TalentTreeNodeField> {
    constructor(
        options?: CollectionFieldOptions,
        context?: foundry.data.fields.DataFieldContext,
    ) {
        super(
            new TalentTreeNodeField({
                nullable: true,
            }),
            options,
            context,
            NodeRecordCollection as typeof RecordCollection,
        );
    }
}

class NodeRecordCollection extends RecordCollection<TalentTree.Node> {
    public override set(id: string, value: TalentTree.Node): this {
        // Ensure the node id matches the record id
        if (value) {
            value.id = id;
        }

        // Set the record
        return super.set(id, value);
    }
}

class TalentTreeNodeField extends foundry.data.fields.SchemaField {
    constructor(
        options?: foundry.data.fields.DataFieldOptions,
        context?: foundry.data.fields.DataFieldContext,
    ) {
        options ??= {};
        options.gmOnly = true;

        super(
            {
                // General node fields
                id: new foundry.data.fields.DocumentIdField({
                    required: true,
                    nullable: false,
                    blank: false,
                    readonly: false,
                }),
                type: new foundry.data.fields.StringField({
                    required: false,
                    nullable: true,
                    blank: false,
                    initial: TalentTree.Node.Type.Talent,
                    choices: [
                        TalentTree.Node.Type.Talent,
                        TalentTree.Node.Type.Tree,
                        TalentTree.Node.Type.Text,
                    ],
                }),
                position: new foundry.data.fields.SchemaField(
                    {
                        x: new foundry.data.fields.NumberField({
                            required: true,
                            nullable: false,
                            label: 'COSMERE.Item.TalentTree.Node.Position.X.Label',
                        }),
                        y: new foundry.data.fields.NumberField({
                            required: true,
                            nullable: false,
                            label: 'COSMERE.Item.TalentTree.Node.Position.Y.Label',
                        }),
                    },
                    {
                        required: true,
                        nullable: false,
                    },
                ),

                // Talent / Tree node fields
                uuid: new foundry.data.fields.DocumentUUIDField({
                    nullable: true,
                }),
                size: new foundry.data.fields.SchemaField(
                    {
                        width: new foundry.data.fields.NumberField({
                            required: true,
                            nullable: false,
                            initial: 50,
                        }),
                        height: new foundry.data.fields.NumberField({
                            required: true,
                            nullable: false,
                            initial: 50,
                        }),
                    },
                    {
                        required: false,
                        nullable: true,
                    },
                ),
                showName: new foundry.data.fields.BooleanField({
                    nullable: true,
                    initial: false,
                }),
                talentId: new foundry.data.fields.StringField({
                    nullable: true,
                }),

                // Talent node fields
                prerequisites: new CollectionField(
                    new foundry.data.fields.SchemaField({
                        id: new foundry.data.fields.StringField({
                            required: true,
                            nullable: false,
                            blank: false,
                        }),
                        type: new foundry.data.fields.StringField({
                            required: true,
                            nullable: false,
                            blank: false,
                            choices:
                                CONFIG.COSMERE.items.talentTree.node
                                    .prerequisite.types,
                        }),
                        managed: new foundry.data.fields.BooleanField({
                            required: true,
                            nullable: false,
                            initial: false,
                        }),

                        // Connection
                        description: new foundry.data.fields.StringField(),

                        // Attribute
                        attribute: new foundry.data.fields.StringField({
                            blank: false,
                            choices: Object.entries(
                                CONFIG.COSMERE.attributes,
                            ).reduce(
                                (acc, [key, config]) => ({
                                    ...acc,
                                    [key]: config.label,
                                }),
                                {},
                            ),
                        }),
                        value: new foundry.data.fields.NumberField({
                            min: 0,
                            initial: 0,
                        }),

                        // Skill
                        skill: new foundry.data.fields.StringField({
                            blank: false,
                            choices: Object.entries(
                                CONFIG.COSMERE.skills,
                            ).reduce(
                                (acc, [key, config]) => ({
                                    ...acc,
                                    [key]: config.label,
                                }),
                                {},
                            ),
                        }),
                        rank: new foundry.data.fields.NumberField({
                            min: 1,
                            initial: 1,
                        }),

                        // Talent
                        talents: new CollectionField(
                            new foundry.data.fields.SchemaField({
                                uuid: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
                                }),
                                id: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
                                }),
                                label: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
                                }),
                            }),
                            {
                                nullable: true,
                            },
                        ),

                        // Level
                        level: new foundry.data.fields.NumberField({
                            min: 0,
                            initial: 0,
                            label: 'COSMERE.Item.Talent.Prerequisite.Level.Label',
                        }),

                        // Ancestry
                        ancestry: new foundry.data.fields.SchemaField(
                            {
                                uuid: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
                                }),
                                id: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
                                }),
                                label: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
                                }),
                            },
                            {
                                nullable: true,
                                initial: null,
                                label: 'COSMERE.Item.Talent.Prerequisite.Ancestry.Label',
                            },
                        ),

                        // Culture
                        culture: new foundry.data.fields.SchemaField(
                            {
                                uuid: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
                                }),
                                id: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
                                }),
                                label: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
                                }),
                            },
                            {
                                nullable: true,
                                initial: null,
                                label: 'COSMERE.Item.Talent.Prerequisite.Culture.Label',
                            },
                        ),

                        // Goal
                        goals: new CollectionField(
                            new foundry.data.fields.SchemaField({
                                uuid: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
                                }),
                                id: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
                                }),
                                label: new foundry.data.fields.StringField({
                                    required: true,
                                    nullable: false,
                                    blank: false,
                                }),
                            }),
                            {
                                nullable: true,
                            },
                        ),
                    }),
                    {
                        nullable: true,
                    },
                ),
                prerequisitesMet: new foundry.data.fields.BooleanField(),
                connections: new CollectionField(
                    new foundry.data.fields.SchemaField({
                        id: new foundry.data.fields.DocumentIdField({
                            required: true,
                            nullable: false,
                            blank: false,
                            readonly: false,
                        }),
                        prerequisiteId: new foundry.data.fields.DocumentIdField(
                            {
                                required: true,
                                nullable: false,
                            },
                        ),
                        path: new foundry.data.fields.ArrayField(
                            new foundry.data.fields.SchemaField({
                                x: new foundry.data.fields.NumberField({
                                    required: true,
                                    nullable: false,
                                }),
                                y: new foundry.data.fields.NumberField({
                                    required: true,
                                    nullable: false,
                                }),
                            }),
                            {
                                nullable: true,
                            },
                        ),
                    }),
                    {
                        nullable: true,
                    },
                ),

                // Text node fields
                text: new foundry.data.fields.StringField({
                    nullable: true,
                }),
            },
            options,
            context,
        );
    }
}
