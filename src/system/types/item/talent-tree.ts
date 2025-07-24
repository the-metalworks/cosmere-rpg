import { Attribute, Skill } from '../cosmere';
import { TalentItem, TalentTreeItem } from '@system/documents/item';

export namespace Node {
    export const enum Type {
        Talent = 'talent',
        Tree = 'tree',
        Text = 'text',
    }

    export interface Connection {
        /**
         * The id of the node this connection goes to
         */
        id: string;

        /**
         * The id of the associated prerequisite rule
         */
        prerequisiteId: string;

        /**
         * The points to draw the connection between the nodes
         */
        path?: {
            x: number;
            y: number;
        }[];
    }

    export namespace Prerequisite {
        export const enum Type {
            Talent = 'talent',
            Attribute = 'attribute',
            Skill = 'skill',
            Connection = 'connection',
            Level = 'level',
            Ancestry = 'ancestry',
            Culture = 'culture',
            Goal = 'goal',
        }

        export const enum Mode {
            AnyOf = 'any-of',
            AllOf = 'all-of',
        }

        export interface ItemRef {
            /**
             * UUID of the item this prerequisite refers to.
             */
            uuid: string;

            /**
             * The id of the item
             */
            id: string;

            /**
             * The name of the item
             */
            label: string;
        }

        export type TalentRef = ItemRef;

        export type GoalRef = ItemRef;
    }

    interface BasePrerequisite<Type extends Prerequisite.Type> {
        id: string;
        type: Type;

        /**
         * Whether or not this prerequisite is managed by the system.
         * Managed prerequisites cannot be manually edited by the user.
         */
        managed: boolean;
    }

    export interface ConnectionPrerequisite
        extends BasePrerequisite<Prerequisite.Type.Connection> {
        description: string;
    }

    export interface AttributePrerequisite
        extends BasePrerequisite<Prerequisite.Type.Attribute> {
        attribute: Attribute;
        value: number;
    }

    export interface SkillPrerequisite
        extends BasePrerequisite<Prerequisite.Type.Skill> {
        skill: Skill;
        rank: number;
    }

    export interface TalentPrerequisite
        extends BasePrerequisite<Prerequisite.Type.Talent> {
        talents: Collection<Prerequisite.TalentRef>;
    }

    export interface GoalPrerequisite
        extends BasePrerequisite<Prerequisite.Type.Goal> {
        goals: Collection<Prerequisite.GoalRef>;
    }

    export interface LevelPrerequisite
        extends BasePrerequisite<Prerequisite.Type.Level> {
        level: number;
    }

    export interface AncestryPrerequisite
        extends BasePrerequisite<Prerequisite.Type.Ancestry> {
        ancestry: Prerequisite.ItemRef;
    }

    export interface CulturePrerequisite
        extends BasePrerequisite<Prerequisite.Type.Culture> {
        culture: Prerequisite.ItemRef;
    }

    export type Prerequisite =
        | ConnectionPrerequisite
        | AttributePrerequisite
        | SkillPrerequisite
        | TalentPrerequisite
        | LevelPrerequisite
        | AncestryPrerequisite
        | CulturePrerequisite
        | GoalPrerequisite;
}

export interface BaseNode<Type extends Node.Type = Node.Type> {
    /**
     * Unique identifier for the node
     */
    id: string;

    /**
     * Node type
     */
    type: Type;

    /**
     * Position to render the node in the tree
     */
    position: {
        x: number;
        y: number;
    };
}

export interface TalentNode extends BaseNode<Node.Type.Talent> {
    /**
     * The system id of the talent item the node refers to.
     */
    talentId: string;

    /**
     * The UUID of the TalentItem the node refers to.
     */
    uuid: string;

    /**
     * The prerequisites to unlock the talent in this tree.
     */
    prerequisites: Collection<Node.Prerequisite>;

    /**
     * Derived value that indicates whether or not the
     * prerequisites have been met.
     * If no prerequisites are defined for this talent
     * This value will be `true`.
     *
     * NOTE: We have no way of checking character connections as
     * they're just plain strings.
     */
    prerequisitesMet: boolean;

    /**
     * The connections to other nodes.
     */
    connections: Collection<Node.Connection>;

    /**
     * The size of the node
     */
    size: {
        width: number;
        height: number;
    };

    /**
     * Whether to show the name of the talent or not
     */
    showName: boolean;
}

export interface TreeNode extends BaseNode<Node.Type.Tree> {
    /**
     * The UUID of the TalentTreeItem the node refers to.
     */
    uuid: string;
}

export interface TextNode extends BaseNode<Node.Type.Text> {
    /**
     * The text to display in the node
     */
    text: string;
}

export type Node = TalentNode | TreeNode | TextNode;
