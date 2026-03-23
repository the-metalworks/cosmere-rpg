import { Attribute, Skill } from '@system/types/cosmere';
import { SYSTEM_ID } from '../constants';

export enum OverridableFieldKey {
    Health = 'health',
    HealthIncludeStrength = 'healthIncludeStrength',
    AttributePoints = 'attributePoints',
    SkillRanks = 'skillRanks',
    Talents = 'talents',
    SkillRanksOrTalents = 'skillRanksOrTalents',
}

export const enum OverrideType {
    Generic = 'generic',
    Maximum = 'maximum',
}

export const enum OverrideMode {
    Absolute = 'absolute',
    Relative = 'relative',
}

export const enum FieldType {
    Numeric = 'numeric',
    Boolean = 'boolean',
}

export type OverrideFieldType = number | boolean;

export interface OverrideData {
    type: OverrideType;
    mode: OverrideMode;
    key: OverridableFieldKey | MaxStatFieldKey;
    value: OverrideFieldType;
}

export interface GenericOverrideData extends OverrideData {
    type: OverrideType.Generic;
    key: OverridableFieldKey;
}

export interface MaxOverrideData extends OverrideData {
    type: OverrideType.Maximum;
    key: MaxStatFieldKey;
    value: number;
}

export const GENERIC_FIELD_TYPES: Record<OverridableFieldKey, FieldType> = {
    [OverridableFieldKey.Health]: FieldType.Numeric,
    [OverridableFieldKey.HealthIncludeStrength]: FieldType.Boolean,
    [OverridableFieldKey.AttributePoints]: FieldType.Numeric,
    [OverridableFieldKey.SkillRanks]: FieldType.Numeric,
    [OverridableFieldKey.Talents]: FieldType.Numeric,
    [OverridableFieldKey.SkillRanksOrTalents]: FieldType.Numeric,
} as const;

export type MaxStatField<T extends Attribute | Skill> = {
    base: number;
} & Partial<Record<T, number>>;

export enum MaxStatFieldKey {
    Attributes = 'attributes',
    Skills = 'skills',
}

export interface MaxStatFields {
    [MaxStatFieldKey.Attributes]?: MaxStatField<Attribute>;
    [MaxStatFieldKey.Skills]?: MaxStatField<Skill>;
}

export interface RuleData {
    level: number;
    tier: number;

    fields: Partial<Record<OverridableFieldKey, OverrideFieldType>>;
    maxStats?: MaxStatFields;
}

// Type assertions

export function assertValidGenericOverride(
    data: OverrideData,
): asserts data is GenericOverrideData {
    if (
        data.type !== OverrideType.Generic ||
        !(data.key in OverridableFieldKey)
    )
        throw new Error(
            `${SYSTEM_ID}: cannot create generic override for ${data.key}`,
        );

    const fieldType = GENERIC_FIELD_TYPES[data.key as OverridableFieldKey];
    switch (fieldType) {
        case FieldType.Boolean:
            return assertBooleanOverride(data.value);
        case FieldType.Numeric:
            return assertNumericOverride(data.value);
        default:
            throw new Error(
                `${SYSTEM_ID}: field type ${fieldType as string} is valid but not implemented`,
            );
    }
}

export function assertValidMaximumOverride(
    data: OverrideData,
): asserts data is MaxOverrideData {
    if (data.type !== OverrideType.Maximum || !(data.key in MaxStatFieldKey))
        throw new Error(
            `${SYSTEM_ID}: cannot create max stat override for ${data.key}`,
        );

    assertNumericOverride(data.value);
}

export function assertNumericOverride(
    value: OverrideFieldType,
): asserts value is number {
    if (!Number.isNumeric(value))
        throw new Error(
            `${SYSTEM_ID}: invalid value for numeric override: ${value}`,
        );
}

export function assertBooleanOverride(
    value: OverrideFieldType,
): asserts value is boolean {
    if (typeof value !== 'boolean')
        throw new Error(
            `${SYSTEM_ID}: invalid value for boolean override: ${value}`,
        );
}
