import { InjuryType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { TypedItemMixin, TypedItemData } from './mixins/typed';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';

export interface InjuryItemData
    extends TypedItemData<InjuryType>,
        DescriptionItemData {
    duration: {
        /**
         * Rolled duration, in days.
         * This value is not defined in the case of a permanent injury.
         */
        initial?: number;

        /**
         * Time until the injury is healed, in days.
         * This value is not defined in the case of a permanent injury.
         */
        remaining?: number;
    };
}

export class InjuryItemDataModel extends DataModelMixin<
    InjuryItemData,
    CosmereItem
>(
    TypedItemMixin({
        // Default to flesh wound data as the least impactful injury type
        initial: InjuryType.FleshWound,
        choices: () =>
            Object.entries(CONFIG.COSMERE.injury.types).reduce(
                (acc, [key, { label }]) => ({
                    ...acc,
                    [key]: label,
                }),
                {} as Record<InjuryType, string>,
            ),
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Injury.desc_placeholder',
    }),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            duration: new foundry.data.fields.SchemaField({
                initial: new foundry.data.fields.NumberField({
                    nullable: true,
                    integer: true,
                    min: 0,
                    initial: 1,
                }),
                remaining: new foundry.data.fields.NumberField({
                    nullable: true,
                    integer: true,
                    min: 0,
                    initial: 1,
                }),
            }),
        });
    }

    get typeLabel(): string {
        return CONFIG.COSMERE.injury.types[this.type].label;
    }
}
