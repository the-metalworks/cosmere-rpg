export const enum Type {
    Ancestry = 'ancestry',
    Path = 'path',
    Power = 'power',
}

export const enum SourceType {
    Ancestry = 'ancestry',
    Path = 'path',
    Power = 'power',
    Tree = 'tree',
}

export interface Source {
    type: SourceType;
    id: string;
    uuid: string;
}

export namespace GrantRule {
    export const enum Type {
        Items = 'items',
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

export type GrantRule = ItemsGrantRule;
