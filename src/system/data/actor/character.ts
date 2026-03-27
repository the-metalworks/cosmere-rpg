// Types
import { Resource } from '@system/types/cosmere';
import { DeepPartial, AnyObject, EmptyObject } from '@system/types/utils';

import {
    CommonActorDataModel,
    CommonActorDataSchema,
    AttributeData,
} from './common';

// Fields
import { DerivedValueField, Derived, MappingField } from '../fields';

const SCHEMA = () => ({
    /* --- Advancement --- */
    level: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        min: 1,
        initial: 1,
        label: 'COSMERE.Actor.Level.Label',
    }),

    /* --- Derived statistics --- */
    recovery: new foundry.data.fields.SchemaField({
        die: new DerivedValueField(
            new foundry.data.fields.StringField({
                required: true,
                blank: false,
                initial: 'd4',
                choices: () => RECOVERY_DICE,
                nullable: false,
            }),
        ),
    }),

    /* --- Purpose and Obstacle --- */
    purpose: new foundry.data.fields.HTMLField({
        required: true,
        initial: '',
    }),
    obstacle: new foundry.data.fields.HTMLField({
        required: true,
        initial: '',
    }),
});

export type CharacterActorDataSchema = ReturnType<typeof SCHEMA> &
    CommonActorDataSchema;

export type CharacterActorData =
    foundry.data.fields.SchemaField.InitializedData<CharacterActorDataSchema>;

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type CharacterActorDerivedData = {
    /**
     * Derived value for the maximum rank a skill can be.
     * Based on the configured advancement rules.
     */
    maxSkillRank: number;
};

export class CharacterActorDataModel extends CommonActorDataModel<
    CharacterActorDataSchema,
    CharacterActorDerivedData
> {
    public static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA());
    }

    public prepareDerivedData() {
        super.prepareDerivedData();
    }

    public override prepareSecondaryDerivedData(): void {
        // Derive the recovery die based on the character's willpower
        this.recovery.die.derived = willpowerToRecoveryDie(this.attributes.wil);

        // Derive max focus
        this.resources[Resource.Focus].max.derived =
            2 + this.attributes.wil.value; // Should only be the value, not include the bonus

        // Perform super secondary derived data preparation after so resource max is set
        super.prepareSecondaryDerivedData();
    }
}

export const RECOVERY_DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
function willpowerToRecoveryDie(attr: AttributeData) {
    const willpower = attr.value + attr.bonus;
    return RECOVERY_DICE[
        Math.min(Math.ceil(willpower / 2), RECOVERY_DICE.length - 1)
    ];
}
