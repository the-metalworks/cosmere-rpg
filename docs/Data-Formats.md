# Data Formats

Here we will define any data structures we expose within the Cosmere RPG system for users to use in their homebrews, macros and extension modules.

> **Note:** A lot of what is here is likely to undergo some degree of restructure and renaming in the near future

## Roll Data

Roll data is an object Foundry uses to provide values derived from a source actor into the roll engine, so that tagged parameters in a dice formula can be replaced with valid formula values. E.g. `@attribute.str.value` would be replaced with the actor's strength score.

This is likely to be the most commonly used data type for casual users, as these are the values used when defining roll formula in any of the formula inputs. For specifics on any specific type of sheet, please see the documentation relating to that sheet [TBD].

<table>
    <tr><th style="width: 40%">Format</th><th>Comments</th></tr>
    <tr>
        <td style="width: 40%">
            <pre>
{
    size: string,
    type: {
        // --- See Comment 1 --- //
        id: string, 
    },
    tier: number,
    senses: {
        range: {
            // --- See Comment 2 --- //
            derived: number,
            override: number,
            useOverride: boolean,
            bonus: number
        },
        obscuredAffected: boolean
    },
    immunities: {
        damage: {
            energy, impact, keen, spirit, vital, heal: boolean,
        },
        condition: {
            determined,
            disoriented,
            empowered,
            exhausted,
            focused,
            immobilized,
            prone,
            restrained,
            slowed,
            stunned,
            surprised,
            unconcious: boolean
        }
    },
    attributes: {
        // --- See Comment 3 --- //
        str, spd, int, will, awa, pre: {
            value: number,
            bonus: number
        },
    },
    defenses: {
        phy, cog, spi: {
            // derived
        },
    },
    resources: {
        hea, foc, inv: {
            value: number,
            max: {
                // derived
            },
            bonus: number
        },
    },
    skills: {
        // --- See Comment 4 --- //
        agi, ath, hwp, lwp, stl, thv, cra, ded, dis, 
        inm, lor, med, dec, ins, lea, prc, prs, sur: {
            rank: number,
            mod: number
        }
    },
    currency: {
        // --- See Comment 5 --- //
        spheres: {
            denominations: [],
            total: {
                // derived
            }
        }
    },
    deflect: {
        natural: number,
        source: armor,
        // derived fields
    },
    movement: {
        walk, fly, swim: {
            rate: {
                // derived
            }
        }
    },
    injuries: {
        // derived
    },
    injuryRollBonus: number,
    encumbrance: {
        lift, carry: {
            // derived
        }
    },
    expertises: [
        {
            type: string,
            id: string,
            label: string,
            custom: boolean,
            locked: boolean
        },
        ...
    ],
    languages: [],
    biography: EnrichedHTMLString,
    appearance: EnrichedHTMLString,
    notes: EnrichedHTMLString,
    level: number,
    maxSkillRank: number,
    recovery: {
        die: {
            // derived
        }
    },
    goals: [
        {}
        ...
    ],
    connections: [
        {}
        ...
    ],
    purpose: string,
    obstacle: string,
    name: string,
    attr: {
        // --- See Comment 6 --- //
        str, spd, int, wil, awa, per: number,
    },
    scalar: {
        // --- See Comment 7 --- //
        damage: {
            unarmed: string
        },
        power: {
            [skillId]: {
                die: string,
                effect-size: string
            },
            ...
        }
    },
    token: {
        name: string
    },
    // --- See Comment 8 --- //
    source: DocumentDataModel
}
            </pre>
        </td>
        <td style="vertical-align: top">

1. Ancestry type, usually will be "humanoid", but also could be "animal" or "custom".

2. This is an example of a derived data field. "derived" will give the base value as calculated from stats, "useOverride" is a flag to detect whether the object is configured to override the base value, "override" is the override value provided for te base, "bonus" is the total of all relevant bonus effects to be added to the base value.

3. We often use 3-letter trigraphs to create unique shorthands for game terms such as attribute names and skills.

4. This skill list will also include book-specific entries not included here, you'll have to buy the modules to see examples! Or register your own custom skills.

5. This object will include all different types of currency the character holds.

6. Another shorthand option. This is just for the attribute totals.

7. The scalar groups are intended to hold values that increase in non-linear fashion based on other values of the character. e.g. unarmed damage or special powers. This will return the character's current calculated value for these.

8. This is the source of the data, it's a whole snapshot of the document's model data. This is mostly for providing to Hooks.
        </td>
    </tr>
</table>

## Enricher Data

The enricher data model is a superset of the roll data. This is used so that the enrichers can generate their display elements using the correct values. Because Enrichers can have many contexts and roles, the object is split into top-level categories all of which are optional in one context or another. For more details and usage examples see [Enrichers](./Enrichers.md).

<table>
    <tr><th style="width: 40%">Format</th><th>Comments</th></tr>
    <tr>
        <td style="width: 40%">
            <pre>
{
    actor: RollData,
    item: {
        name: string
        charges: {
            value: number,
            max: number
        }
    },
    target: {
        uuid: string,
        name: string,
        img: string,
        def: {
            phy, cog, spi: number
        }
    }
}
            </pre>
        </td>
        <td>

* **Actor:** A copy of the most relevant Actor's [RollData](#roll-data).
  * For Items this is usually the parent who the item instance is embedded in and for Actors it's the Actor them self.

* **Item:** This only appears for enrichers on item sheets. This is detail relevant to the host item itself.
  * Charges should only populate if the item is configured for charges.

* **Target:** Some basic information about the [currently first] target the user had selected *when the prosemirror input was enriched*.
        </td>
    </tr>
</table>