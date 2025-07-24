import { CosmereItem } from '@system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemData } from './mixins/id';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';

export interface SpecialtyItemData extends IdItemData, DescriptionItemData {
    /**
     * The id of the Path this Specialty belongs to
     */
    path: string;

    /**
     * Derived value that indicates whether or not the parent
     * Actor has the required Path
     */
    hasPath: boolean;
}

export class SpecialtyItemDataModel extends DataModelMixin<
    SpecialtyItemData,
    CosmereItem
>(
    IdItemMixin({ initialFromName: true }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Specialty.desc_placeholder',
    }),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            path: new foundry.data.fields.StringField({
                required: true,
                nullable: false,
                blank: false,
                initial: '<path>',
            }),
            hasPath: new foundry.data.fields.BooleanField(),
        });
    }

    public prepareDerivedData() {
        super.prepareDerivedData();

        // Get item
        const item = this.parent;

        // Get actor
        const actor = item.actor;

        // Determine whether actor has path
        this.hasPath =
            actor?.items.some(
                (item) => item.isPath() && item.id === this.path,
            ) ?? false;
    }
}
