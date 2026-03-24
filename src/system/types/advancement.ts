import { Attribute, Skill } from '@system/types/cosmere';
import { SYSTEM_ID } from '@system/constants';

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

/**
 * Map a given FieldType to the specific OverrideFieldType it represents
 */
export interface FieldTypeToOverrideType
    extends Record<FieldType, OverrideFieldType> {
    [FieldType.Boolean]: boolean;
    [FieldType.Numeric]: number;
}

export interface OverrideData {
    type: OverrideType;
    mode: OverrideMode;
    key: GenericFieldKey | MaxStatFieldKey;
    value: OverrideFieldType;
}

export interface GenericOverrideData extends OverrideData {
    type: OverrideType.Generic;
    key: GenericFieldKey;
}

export interface MaxOverrideData extends OverrideData {
    type: OverrideType.Maximum;
    key: MaxStatFieldKey;
    stat?: MaxStatType;
    value: number;
}

export enum GenericFieldKey {
    Health = 'health',
    HealthIncludeStrength = 'healthIncludeStrength',
    AttributePoints = 'attributePoints',
    SkillRanks = 'skillRanks',
    Talents = 'talents',
    SkillRanksOrTalents = 'skillRanksOrTalents',
}

/**
 * Living list of the fields that can be overridden on a generic basis
 */
export const GENERIC_FIELD_TYPES = {
    [GenericFieldKey.Health]: FieldType.Numeric,
    [GenericFieldKey.HealthIncludeStrength]: FieldType.Boolean,
    [GenericFieldKey.AttributePoints]: FieldType.Numeric,
    [GenericFieldKey.SkillRanks]: FieldType.Numeric,
    [GenericFieldKey.Talents]: FieldType.Numeric,
    [GenericFieldKey.SkillRanksOrTalents]: FieldType.Numeric,
} as const;

/**
 * Automatically map the above fields to the proper OverrideFieldType
 * Not all fields need to be present at a given time
 */
export type GenericFields = Partial<{
    -readonly [k in keyof typeof GENERIC_FIELD_TYPES]: FieldTypeToOverrideType[(typeof GENERIC_FIELD_TYPES)[k]];
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

export type MaxStatFields = Partial<{
    [k in keyof MaxStatFieldTypes]: MaxStatField<MaxStatFieldTypes[k]>;
}>;

// Type assertions

export function assertValidGenericOverride(
    data: OverrideData,
): asserts data is GenericOverrideData {
    if (data.type !== OverrideType.Generic || !(data.key in GenericFieldKey))
        throw new Error(
            `${SYSTEM_ID}: cannot create generic override for ${data.key}`,
        );

    const fieldType = GENERIC_FIELD_TYPES[data.key as GenericFieldKey];
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

    const maxData = data as MaxOverrideData;

    // If no specific state was specified, we'll treat it as the base value
    if (!maxData.stat) return;

    // Otherwise, assert that it exists within the system
    switch (maxData.key) {
        case MaxStatFieldKey.Attributes:
            if (!(maxData.stat in Object.keys(CONFIG.COSMERE.attributes)))
                throw new Error(
                    `${SYSTEM_ID}: invalid attribute for override: ${maxData.stat}`,
                );
            break;
        case MaxStatFieldKey.Skills:
            if (!(maxData.stat in Object.keys(CONFIG.COSMERE.skills)))
                throw new Error(
                    `${SYSTEM_ID}: invalid skill for override: ${maxData.stat}`,
                );
            break;
    }

    // All max overrides must be numeric
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
