import { Skill, PowerType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemData } from './mixins/id';
import { TypedItemMixin, TypedItemData } from './mixins/typed';
import {
    ActivatableItemData,
    ActivatableItemMixin,
} from './mixins/activatable';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';
import { DamagingItemData, DamagingItemMixin } from './mixins/damaging';
import { EventsItemMixin, EventsItemData } from './mixins/events';
import {
    RelationshipsMixin,
    RelationshipsItemData,
} from './mixins/relationships';

export interface PowerItemData
    extends IdItemData,
        TypedItemData<PowerType>,
        DamagingItemData,
        DescriptionItemData,
        EventsItemData,
        RelationshipsItemData {
    /**
     * Wether to a custom skill is used, or
     * the skill is derived from the power's id.
     */
    customSkill: boolean;

    /**
     * The skill associated with this power.
     * This cannot be a core skill.
     * If `customSkill` is `false`, the skill with the same id as the power is used.
     */
    skill: Skill | null;
}

export class PowerItemDataModel extends DataModelMixin<
    PowerItemData,
    CosmereItem
>(
    IdItemMixin({
        initialFromName: true,
        hint: 'COSMERE.Item.Power.Identifier.Hint',
    }),
    TypedItemMixin({
        initial: () => Object.keys(CONFIG.COSMERE.power.types)[0],
        choices: () =>
            Object.entries(CONFIG.COSMERE.power.types).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {},
            ),
    }),
    ActivatableItemMixin(),
    DamagingItemMixin(),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Power.desc_placeholder',
    }),
    EventsItemMixin(),
    RelationshipsMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            customSkill: new foundry.data.fields.BooleanField({
                required: true,
                initial: false,
                label: 'COSMERE.Item.Power.CustomSkill.Label',
                hint: 'COSMERE.Item.Power.CustomSkill.Hint',
            }),

            skill: new foundry.data.fields.StringField({
                required: true,
                nullable: true,
                blank: false,
                label: 'COSMERE.Item.Power.Skill.Label',
                hint: 'COSMERE.Item.Power.Skill.Hint',
                initial: null,
                choices: () =>
                    Object.entries(CONFIG.COSMERE.skills)
                        .filter(([key, skill]) => !skill.core)
                        .reduce(
                            (acc, [key, skill]) => ({
                                ...acc,
                                [key]: skill.label,
                            }),
                            {},
                        ),
            }),
        });
    }

    public prepareDerivedData() {
        super.prepareDerivedData();

        if (!this.customSkill) {
            const validId = this.id in CONFIG.COSMERE.skills;
            this.skill = validId ? (this.id as Skill) : null;
        }
    }
}
