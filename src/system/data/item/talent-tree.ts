import { ItemType } from '@system/types/cosmere';
import {
    CosmereItem,
    TalentItem,
    TalentTreeItem,
} from '@system/documents/item';
import { TalentTree, Talent } from '@system/types/item';
import { AnyObject } from '@system/types/utils';

import { TalentTreeNodeCollectionField } from './fields/talent-tree-node-collection';

// Utils
import {
    characterMeetsTalentPrerequisites,
    getTalents,
} from '@system/utils/talent-tree';

// Mixins
import { DataModelMixin } from '../mixins';

// Constants
const VALID_NODE_TYPES = [
    TalentTree.Node.Type.Talent,
    TalentTree.Node.Type.Tree,
    TalentTree.Node.Type.Text,
] as string[];

const SCHEMA = {
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
}

export type TalentTreeItemDataSchema = typeof SCHEMA;

export class TalentTreeItemDataModel extends DataModelMixin<
    TalentTreeItemDataSchema
>() {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA);
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

    /**
     * The talents referenced by the nodes of this talent tree.
     * @param includeNested - Whether to include talents from nested trees. Defaults to `true`.
     */
    public getTalents(includeNested = true): Promise<TalentItem[]> {
        return getTalents(this.parent, includeNested);
    }
}
