import { Attribute, Skill } from '@system/types/cosmere';
import type { AdvancementOverride } from '@system/utils/advancement';
import { AdvancementOverrideData } from '@system/data/item/misc/advancement-override';

export namespace Advancement {
    // Overrides

    export enum OverrideType {
        Grants = 'grants',
        MaxStat = 'max-stat',
    }

    export enum OverrideMode {
        Absolute = 'absolute',
        Relative = 'relative',
    }

    export const enum FieldType {
        Numeric = 'numeric',
        Boolean = 'boolean',
    }

    export type OverrideFieldType = number | boolean;

    /**
     * Map a given FieldType to the specific OverrideFieldType it represents
     */
    export interface FieldTypeToOverrideType
        extends Record<FieldType, OverrideFieldType> {
        [FieldType.Boolean]: boolean;
        [FieldType.Numeric]: number;
    }

    export interface OverrideLevels {
        min?: number;
        max?: number;
    }

    export interface OverrideData {
        type: OverrideType;
        mode: OverrideMode;
        key: GrantsFieldKey | MaxStatFieldKey;
        value: OverrideFieldType;
        priority: number;

        levels: OverrideLevels;
    }

    export interface GrantsOverrideData extends OverrideData {
        type: OverrideType.Grants;
        key: GrantsFieldKey;
    }

    export interface MaxStatOverrideData extends OverrideData {
        type: OverrideType.MaxStat;
        key: MaxStatFieldKey;
        stat?: MaxStatType;
        value: number;
    }

    export enum GrantsFieldKey {
        Health = 'health',
        HealthIncludeStrength = 'healthIncludeStrength',
        AttributePoints = 'attributePoints',
        SkillRanks = 'skillRanks',
        Talents = 'talents',
        SkillRanksOrTalents = 'skillRanksOrTalents',
    }

    /**
     * Living list of the advancement rule grants that can be overridden
     */
    export const GRANTS_FIELD_TYPES = {
        [GrantsFieldKey.Health]: FieldType.Numeric,
        [GrantsFieldKey.HealthIncludeStrength]: FieldType.Boolean,
        [GrantsFieldKey.AttributePoints]: FieldType.Numeric,
        [GrantsFieldKey.SkillRanks]: FieldType.Numeric,
        [GrantsFieldKey.Talents]: FieldType.Numeric,
        [GrantsFieldKey.SkillRanksOrTalents]: FieldType.Numeric,
    } as const;

    /**
     * Automatically map the above fields to the proper OverrideFieldType
     * Not all fields need to be present at a given time
     */
    export type GrantsFields = Partial<{
        -readonly [k in keyof typeof GRANTS_FIELD_TYPES]: FieldTypeToOverrideType[(typeof GRANTS_FIELD_TYPES)[k]];
    }>;

    export enum MaxStatFieldKey {
        Attributes = 'attributes',
        Skills = 'skills',
    }

    export type MaxStatType = Attribute | Skill;

    export interface MaxStatFieldTypes {
        [MaxStatFieldKey.Attributes]: Attribute;
        [MaxStatFieldKey.Skills]: Skill;
    }

    export type MaxStatField<T extends MaxStatType> = {
        base: number;
    } & Partial<Record<T, number>>;

    export type MaxStatFields = {
        [k in keyof MaxStatFieldTypes]: MaxStatField<MaxStatFieldTypes[k]>;
    };

    // Types for the Advancement Manager

    /**
     * The `AdvancementManager`'s internal registry
     */
    export interface OverrideRegistry {
        /**
         * Overrides which apply without regard to any actor-specific context.
         */
        global: AdvancementOverride[];

        /**
         * A mapping from an item ID (`item.system.id`) to a list
         * of registered overrides.
         */
        items: Record<string, AdvancementOverride[]>;
    }

    /**
     * Helper type to encapsulate all forms of override data,
     * i.e. config, data schema, and class instance.
     */
    export type Override =
        | OverrideData
        | AdvancementOverrideData
        | AdvancementOverride;

    // Type assertions

    export function assertValidGrantsOverride(
        data: OverrideData,
    ): asserts data is GrantsOverrideData {
        if (
            data.type !== OverrideType.Grants ||
            !Object.values<string>(GrantsFieldKey).includes(data.key)
        )
            throw new Error(`cannot create grants override for ${data.key}`);

        const fieldType = GRANTS_FIELD_TYPES[data.key as GrantsFieldKey];
        switch (fieldType) {
            case FieldType.Boolean:
                return assertBooleanOverride(data.value);
            case FieldType.Numeric:
                return assertNumericOverride(data.value);
        }
    }

    export function assertValidMaximumOverride(
        data: OverrideData,
    ): asserts data is MaxStatOverrideData {
        if (
            data.type !== OverrideType.MaxStat ||
            !Object.values<string>(MaxStatFieldKey).includes(data.key)
        )
            throw new Error(`cannot create max stat override for ${data.key}`);

        const maxData = data as MaxStatOverrideData;

        // If no specific state was specified, we'll treat it as the base value
        // Otherwise, assert that it exists within the system
        if (maxData.stat) {
            switch (maxData.key) {
                case MaxStatFieldKey.Attributes:
                    if (
                        !Object.keys(CONFIG.COSMERE.attributes).includes(
                            maxData.stat,
                        )
                    )
                        throw new Error(
                            `invalid attribute for override: ${maxData.stat}`,
                        );
                    break;
                case MaxStatFieldKey.Skills:
                    if (
                        !Object.keys(CONFIG.COSMERE.skills).includes(
                            maxData.stat,
                        )
                    )
                        throw new Error(
                            `invalid skill for override: ${maxData.stat}`,
                        );
                    break;
            }
        }

        // All max overrides must be numeric
        assertNumericOverride(data.value);
    }

    export function assertNumericOverride(
        value: OverrideFieldType,
    ): asserts value is number {
        if (!Number.isNumeric(value))
            throw new Error(`invalid value for numeric override: ${value}`);
    }

    export function assertBooleanOverride(
        value: OverrideFieldType,
    ): asserts value is boolean {
        if (typeof value !== 'boolean')
            throw new Error(`invalid value for boolean override: ${value}`);
    }
}
