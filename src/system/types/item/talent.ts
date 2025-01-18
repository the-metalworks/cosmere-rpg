import { Attribute, Resource, Skill } from '../cosmere';

export const enum Type {
    Ancestry = 'ancestry',
    Path = 'path',
    Power = 'power',
}

export namespace GrantRule {
    export const enum Type {
        Items = 'items',
        Resource = 'resource',
    }
}

export interface BaseGrantRule<Type extends GrantRule.Type> {
    type: Type;
}

export interface ItemsGrantRule extends BaseGrantRule<GrantRule.Type.Items> {
    /**
     * An array of item UUIDs that are granted by this rule.
     */
    items: string[];
}

export interface ResourceGrantRule
    extends BaseGrantRule<GrantRule.Type.Resource> {
    /**
     * The resource key to modify with this rule.
     */
    resource: Resource;

    /**
     * The value with which to modify the selected resource.
     */
    value: string;
}

export type GrantRule = ItemsGrantRule | ResourceGrantRule;

export namespace Prerequisite {
    export const enum Type {
        Talent = 'talent',
        Attribute = 'attribute',
        Skill = 'skill',
        Connection = 'connection',
        Level = 'level',
    }

    export const enum Mode {
        AnyOf = 'any-of',
        AllOf = 'all-of',
    }

    export interface TalentRef {
        /**
         * UUID of the Talent item this prerequisite refers to.
         */
        uuid: string;
        /**
         * The id of the talent
         */
        id: string;
        /**
         * The name of the talent
         */
        label: string;
    }
}

interface BasePrerequisite<Type extends Prerequisite.Type> {
    type: Type;
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
    label?: string;
    talents: Prerequisite.TalentRef[];
    mode: Prerequisite.Mode;
}

export interface LevelPrerequisite
    extends BasePrerequisite<Prerequisite.Type.Level> {
    level: number;
}

export type Prerequisite =
    | ConnectionPrerequisite
    | AttributePrerequisite
    | SkillPrerequisite
    | TalentPrerequisite
    | LevelPrerequisite;
