// Types
import { Resource } from '@system/types/cosmere';
import { DeepPartial, AnyObject } from '@system/types/utils';

import { CommonActorDataModel, CommonActorData } from './common';

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

export class CharacterActorDataModel extends CommonActorDataModel<CharacterActorData> {
    public static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            /* --- Advancement --- */
            level: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                min: 1,
                initial: 1,
                label: 'COSMERE.Actor.Level.Label',
            }),

            maxSkillRank: new foundry.data.fields.NumberField({
                required: true,
                nullable: false,
                integer: true,
                initial: 2,
                max: 5,
            }),

            /* --- Derived statistics --- */
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

            /* --- Goals, Connections, Purpose, and Obstacle --- */
            goals: new foundry.data.fields.ArrayField(
                new foundry.data.fields.SchemaField({
                    text: new foundry.data.fields.StringField({
                        required: true,
                    }),
                    level: new foundry.data.fields.NumberField({
                        required: true,
                        integer: true,
                        initial: 0,
                        min: 0,
                        max: 3,
                    }),
                }),
                {
                    required: true,
                    nullable: true,
                    initial: null,
                },
            ),
            connections: new foundry.data.fields.ArrayField(
                new foundry.data.fields.SchemaField({
                    name: new foundry.data.fields.StringField({
                        required: true,
                    }),
                    description: new foundry.data.fields.HTMLField({
                        required: true,
                    }),
                }),
                {
                    required: true,
                    nullable: false,
                    initial: [],
                },
            ),
            purpose: new foundry.data.fields.HTMLField({
                required: true,
                initial: '',
            }),
            obstacle: new foundry.data.fields.HTMLField({
                required: true,
                initial: '',
            }),
        });
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

        // Derive the recovery die based on the character's willpower
        this.recovery.die.derived = willpowerToRecoveryDie(
            this.attributes.wil.value,
        );

        // Derive resource max
        (Object.keys(this.resources) as Resource[]).forEach((key) => {
            // Get the resource
            const resource = this.resources[key];

            if (key === Resource.Health) {
                // Get strength mod
                const strength =
                    this.attributes.str.value + this.attributes.str.bonus;

                // Assign max
                resource.max.derived = Advancement.deriveMaxHealth(
                    advancementRules,
                    strength,
                );
            } else if (key === Resource.Focus) {
                // Get willpower mod
                const willpower =
                    this.attributes.wil.value + this.attributes.wil.bonus;

                // Assign max
                resource.max.derived = 2 + willpower;
            }

            // Get max
            const max = resource.max.value;

            // Ensure resource value is between max mand min
            resource.value = Math.max(0, Math.min(max, resource.value));
        });
    }
}

export const RECOVERY_DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
function willpowerToRecoveryDie(willpower: number) {
    return RECOVERY_DICE[
        Math.min(Math.ceil(willpower / 2), RECOVERY_DICE.length)
    ];
}
