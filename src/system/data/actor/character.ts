// Types
import { Resource } from '@system/types/cosmere';
import { DeepPartial, AnyObject } from '@system/types/utils';

import { CommonActorDataModel, CommonActorDataSchema, AttributeData } from './common';

// Utils
import * as Advancement from '@system/utils/advancement';

// Fields
import { DerivedValueField, Derived, MappingField } from '../fields';

interface GoalData {
    text: string;
    level: number;
}

interface ConnectionData {
    name: string;
    description: string;
}

export interface CharacterActorData extends CommonActorData {
    /* --- Advancement --- */
    level: number;

    /**
     * Derived value for the maximum rank a skill can be.
     * Based on the configured advancement rules.
     */
    maxSkillRank: number;

    /* --- Derived statistics --- */
    recovery: { die: Derived<string> };

    /* --- Goals, Connections, Purpose, and Obstacle --- */
    purpose: string;
    obstacle: string;
    goals?: GoalData[];
    connections: ConnectionData[];
}

const SCHEMA = {
    /* --- Advancement --- */
    level: new foundry.data.fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        min: 1,
        initial: 1,
        label: 'COSMERE.Actor.Level.Label',
    }),

    recovery: new foundry.data.fields.SchemaField({
        die: new DerivedValueField(
            new foundry.data.fields.StringField({
                required: true,
                blank: false,
                initial: 'd4',
                choices: RECOVERY_DICE,
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
}

export type CharacterActorDataSchema =
    & typeof SCHEMA
    & CommonActorDataSchema;

export interface CharacterActorDerivedData {
    /**
     * Derived value for the maximum rank a skill can be.
     * Based on the configured advancement rules.
     */
    maxSkillRank: number;
}

export class CharacterActorDataModel extends CommonActorDataModel<CharacterActorDataSchema> {
    public static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA);


        //     maxSkillRank: new foundry.data.fields.NumberField({
        //         required: true,
        //         nullable: false,
        //         integer: true,
        //         initial: 2,
        //         max: 5,
        //     }),

        //     /* --- Derived statistics --- */
        //     recovery: new foundry.data.fields.SchemaField({
        //         die: new DerivedValueField(
        //             new foundry.data.fields.StringField({
        //                 required: true,
        //                 blank: false,
        //                 initial: 'd4',
        //                 choices: RECOVERY_DICE,
        //             }),
        //         ),
        //     }),
        // });
    }

    public prepareDerivedData() {
        super.prepareDerivedData();

        // Get advancement rules relevant to the character
        const advancementRules = Advancement.getAdvancementRulesUpToLevel(
            this.level,
        );
        const currentAdvancementRule =
            advancementRules[advancementRules.length - 1];

        // Derive the tier
        this.tier = currentAdvancementRule.tier;

        // Derive the maximum skill rank
        this.maxSkillRank = currentAdvancementRule.maxSkillRanks;
    }

    public override prepareSecondaryDerivedData(): void {
        // Get advancement rules relevant to the character
        const advancementRules = Advancement.getAdvancementRulesUpToLevel(
            this.level,
        );

        // Derive the recovery die based on the character's willpower
        this.recovery.die.derived = willpowerToRecoveryDie(this.attributes.wil);

        // Derive resource max
        (Object.keys(this.resources) as Resource[]).forEach((key) => {
            // Get the resource
            const resource = this.resources[key];

            if (key === Resource.Health) {
                // Assign max
                resource.max.derived = Advancement.deriveMaxHealth(
                    advancementRules,
                    this.attributes.str.value, // Should only be the value, not include the bonus
                );
            } else if (key === Resource.Focus) {
                // Assign max
                resource.max.derived = 2 + this.attributes.wil.value; // Should only be the value, not include the bonus
            }
        });

        // Perform super secondary derived data preparation after so resource max is set
        super.prepareSecondaryDerivedData();
    }
}

export const RECOVERY_DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
function willpowerToRecoveryDie(attr: AttributeData) {
    const willpower = attr.value + attr.bonus;
    return RECOVERY_DICE[
        Math.min(Math.ceil(willpower / 2), RECOVERY_DICE.length)
    ];
}
