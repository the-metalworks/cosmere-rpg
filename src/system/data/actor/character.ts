// Types
import { Resource } from '@system/types/cosmere';

import {
    CommonActorDataModel,
    CommonActorDataSchema,
    AttributeData,
} from './common';

// Fields
import { DerivedValueField } from '../fields';

// Advancement
import {
    AdvancementOverrideData,
    AdvancementOverrideDataModel,
} from '../item/misc/advancement-override';
import AdvancementManager from '@src/system/utils/advancement';
import { Advancement } from '@src/system/types/advancement';
import { CharacterActor } from '@src/system/documents';

const SCHEMA = () => ({
    /* --- Advancement --- */
    advancement: new foundry.data.fields.SchemaField({
        level: new foundry.data.fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            min: 1,
            initial: 1,
            label: 'COSMERE.Actor.Advancement.Level.Label',
        }),
        overrides: new foundry.data.fields.ArrayField(
            new foundry.data.fields.SchemaField(
                AdvancementOverrideDataModel.defineSchema(),
            ),
            {
                required: true,
                label: 'COSMERE.Actor.Advancement.Overrides.Label',
            },
        ),
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

        // Get advancement rules relevant to the character
        const advancementRules =
            AdvancementManager.getAdvancementRulesUpToLevel(
                this.advancement.level,
                this.parent as CharacterActor,
            );
        const currentAdvancementRule =
            advancementRules[advancementRules.length - 1];

        // Derive the tier
        this.tier = currentAdvancementRule.tier;

        // Derive the maximum skill rank
        this.maxSkillRank =
            currentAdvancementRule.maxStats[
                Advancement.MaxStatFieldKey.Skills
            ].base;
    }

    public override prepareSecondaryDerivedData(): void {
        // Get advancement rules relevant to the character
        const advancementRules =
            AdvancementManager.getAdvancementRulesUpToLevel(
                this.advancement.level,
                this.parent as CharacterActor,
            );

        // Derive the recovery die based on the character's willpower
        this.recovery.die.derived = willpowerToRecoveryDie(this.attributes.wil);

        // Derive max health
        this.resources[Resource.Health].max.derived =
            AdvancementManager.deriveMaxHealth(
                advancementRules,
                this.attributes.str.value, // Should only be the value, not include the bonus
                this.parent as CharacterActor,
            );

        // Derive max focus
        this.resources[Resource.Focus].max.derived =
            2 + this.attributes.wil.value; // Should only be the value, not include the bonus

        // Perform super secondary derived data preparation after so resource max is set
        super.prepareSecondaryDerivedData();
    }

    /**
     * Get all applicable overrides on this character at a given level,
     * sorted by priority (i.e. ready to be applied to a given AdvancementRule)
     */
    public getAdvancementOverridesAtLevel(
        level: number,
    ): AdvancementOverrideData[] {
        return this.advancement.overrides.filter(
            (override) => override.level === level,
        );
    }
}

export const RECOVERY_DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
function willpowerToRecoveryDie(attr: AttributeData) {
    const willpower = attr.value + attr.bonus;
    return RECOVERY_DICE[
        Math.min(Math.ceil(willpower / 2), RECOVERY_DICE.length - 1)
    ];
}
