import { Size, CreatureType } from '@system/types/cosmere';
import { CosmereItem, PathItem, TalentItem } from '@system/documents/item';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemData } from './mixins/id';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';

interface TalentGrant {
    uuid: string;
    level: number;
}

export interface BonusTalentsRule {
    level: number;
    quantity: number;
    restrictions: string;
}

export interface AncestryItemData extends IdItemData, DescriptionItemData {
    size: Size;
    type: {
        id: CreatureType;
        custom?: string | null;
        subtype?: string | null;
    };
    advancement: {
        extraPath: string; // UUID of the PathItem

        /**
         * This is a list of talents that are granted to the character
         * at specific levels.
         */
        extraTalents: TalentGrant[];

        /**
         * This is the number of bonus talents a character
         * with this ancestry can pick at each level.
         */
        bonusTalents: BonusTalentsRule[];
    };
}

export class AncestryItemDataModel extends DataModelMixin<
    AncestryItemData,
    CosmereItem
>(
    IdItemMixin({
        initial: 'none',
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Ancestry.desc_placeholder',
    }),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            size: new foundry.data.fields.StringField({
                required: true,
                nullable: false,
                blank: false,
                initial: Size.Medium,
                choices: Object.entries(CONFIG.COSMERE.sizes).reduce(
                    (acc, [key, config]) => ({
                        ...acc,
                        [key]: config.label,
                    }),
                    {},
                ),
            }),
            type: new foundry.data.fields.SchemaField({
                id: new foundry.data.fields.StringField({
                    required: true,
                    nullable: false,
                    blank: false,
                    initial: CreatureType.Humanoid,
                    choices: Object.entries(
                        CONFIG.COSMERE.creatureTypes,
                    ).reduce(
                        (acc, [key, config]) => ({
                            ...acc,
                            [key]: config.label,
                        }),
                        {},
                    ),
                }),
                custom: new foundry.data.fields.StringField({ nullable: true }),
                subtype: new foundry.data.fields.StringField({
                    nullable: true,
                }),
            }),
            advancement: new foundry.data.fields.SchemaField({
                extraPath: new foundry.data.fields.DocumentUUIDField({
                    type: 'Item',
                }),
                extraTalents: new foundry.data.fields.ArrayField(
                    new foundry.data.fields.SchemaField({
                        uuid: new foundry.data.fields.DocumentUUIDField({
                            type: 'Item',
                        }),
                        level: new foundry.data.fields.NumberField(),
                    }),
                ),

                bonusTalents: new foundry.data.fields.ArrayField(
                    new foundry.data.fields.SchemaField({
                        level: new foundry.data.fields.NumberField({
                            required: true,
                            min: 0,
                            initial: 0,
                        }),
                        quantity: new foundry.data.fields.NumberField({
                            required: true,
                            min: 0,
                            initial: 0,
                        }),
                        restrictions: new foundry.data.fields.StringField(),
                    }),
                ),
            }),
        });
    }

    get typeFieldId(): foundry.data.fields.StringField {
        return this.schema.fields.type._getField([
            'id',
        ]) as foundry.data.fields.StringField;
    }

    get sizeField(): foundry.data.fields.StringField {
        return this.schema.fields.size as foundry.data.fields.StringField;
    }

    get extraTalents(): TalentGrant[] {
        return this.advancement.extraTalents;
    }
}
