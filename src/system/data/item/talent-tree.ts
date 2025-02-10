import { ItemType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';
import { TalentTree, Talent } from '@system/types/item';
import { AnyObject } from '@system/types/utils';

import { TalentTreeNodeCollectionField } from './fields/talent-tree-node-collection';

// Utils
import { characterMeetsTalentPrerequisites } from '@system/utils/talent-tree';

// Mixins
import { DataModelMixin } from '../mixins';

// Constants
const VALID_NODE_TYPES = [
    TalentTree.Node.Type.Talent,
    TalentTree.Node.Type.Tree,
    TalentTree.Node.Type.Text,
] as string[];

export interface TalentTreeItemData {
    /**
     * The list of nodes in the tree
     */
    nodes: Collection<TalentTree.Node>;

    /**
     * The view bounds of the talent tree when
     * not in edit mode.
     */
    viewBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };

    /**
     * The display size of the talent tree
     */
    display: {
        width?: number;
        height?: number;
    };

    /**
     * The background image of the talent tree
     */
    background: {
        img?: string;
        width: number;
        height: number;
        position: {
            x: number;
            y: number;
        };
    };
}

export class TalentTreeItemDataModel extends DataModelMixin<
    TalentTreeItemData,
    CosmereItem
>() {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            nodes: new TalentTreeNodeCollectionField({
                required: true,
                nullable: false,
                gmOnly: true,
            }),

            viewBounds: new foundry.data.fields.SchemaField(
                {
                    x: new foundry.data.fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 0,
                        label: 'COSMERE.Item.TalentTree.ViewBounds.X.Label',
                    }),
                    y: new foundry.data.fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 0,
                        label: 'COSMERE.Item.TalentTree.ViewBounds.Y.Label',
                    }),
                    width: new foundry.data.fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 800,
                        label: 'COSMERE.Item.TalentTree.ViewBounds.Width.Label',
                    }),
                    height: new foundry.data.fields.NumberField({
                        required: true,
                        nullable: false,
                        integer: true,
                        initial: 650,
                        label: 'COSMERE.Item.TalentTree.ViewBounds.Height.Label',
                    }),
                },
                {
                    required: true,
                    nullable: false,
                },
            ),

            display: new foundry.data.fields.SchemaField({
                width: new foundry.data.fields.NumberField({
                    required: false,
                    nullable: true,
                    integer: true,
                    label: 'COSMERE.Item.TalentTree.Display.Width.Label',
                }),
                height: new foundry.data.fields.NumberField({
                    required: false,
                    nullable: true,
                    integer: true,
                    label: 'COSMERE.Item.TalentTree.Display.Height.Label',
                }),
            }),

            background: new foundry.data.fields.SchemaField({
                img: new foundry.data.fields.FilePathField({
                    required: false,
                    nullable: true,
                    categories: ['IMAGE'],
                    label: 'COSMERE.Item.TalentTree.Background.Img.Label',
                }),
                width: new foundry.data.fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    label: 'COSMERE.Item.TalentTree.Background.Size.Width.Label',
                }),
                height: new foundry.data.fields.NumberField({
                    required: true,
                    nullable: false,
                    integer: true,
                    initial: 0,
                    label: 'COSMERE.Item.TalentTree.Background.Size.Height.Label',
                }),
                position: new foundry.data.fields.SchemaField(
                    {
                        x: new foundry.data.fields.NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            initial: 0,
                            label: 'COSMERE.Item.TalentTree.Background.Position.X.Label',
                        }),
                        y: new foundry.data.fields.NumberField({
                            required: true,
                            nullable: false,
                            integer: true,
                            initial: 0,
                            label: 'COSMERE.Item.TalentTree.Background.Position.Y.Label',
                        }),
                    },
                    {
                        required: true,
                        nullable: false,
                    },
                ),
            }),
        });
    }

    static migrateData(source: AnyObject) {
        if ('nodes' in source && typeof source.nodes === 'object') {
            Object.entries(
                source.nodes as Record<
                    string,
                    {
                        type: string;
                        position: {
                            x: number;
                            y: number;
                            column?: number;
                            row?: number;
                        };
                    }
                >,
            ).forEach(([key, node]) => {
                if ('type' in node && !VALID_NODE_TYPES.includes(node.type)) {
                    node.type = TalentTree.Node.Type.Talent;
                }

                if ('position' in node) {
                    if ('column' in node.position) {
                        node.position.x = node.position.column! * 50 * 2;
                        delete node.position.column;
                    }

                    if ('row' in node.position) {
                        node.position.y = node.position.row! * 50 * 2;
                        delete node.position.row;
                    }
                }
            });
        }

        return super.migrateData(source) as AnyObject;
    }

    public prepareDerivedData() {
        // Get item
        const item = this.parent;

        // Get actor
        const actor = item.actor;

        // Loop through talent nodes
        this.nodes
            .filter((node) => node.type === TalentTree.Node.Type.Talent)
            .forEach((node) => {
                // Check if prerequisites are met
                if (!actor?.isCharacter()) {
                    node.prerequisitesMet = false;
                } else {
                    node.prerequisitesMet = characterMeetsTalentPrerequisites(
                        actor,
                        node.prerequisites,
                    );
                }
            });
    }
}
