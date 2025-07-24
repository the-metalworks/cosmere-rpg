import { ActionType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents';

// Mixins
import { DataModelMixin } from '../mixins';
import { IdItemMixin, IdItemData } from './mixins/id';
import { TypedItemMixin, TypedItemData } from './mixins/typed';
import {
    DescriptionItemMixin,
    DescriptionItemData,
} from './mixins/description';
import {
    ActivatableItemMixin,
    ActivatableItemData,
} from './mixins/activatable';
import { DamagingItemMixin, DamagingItemData } from './mixins/damaging';
import { ModalityItemMixin, ModalityItemData } from './mixins/modality';

export interface ActionItemData
    extends DescriptionItemData,
        ActivatableItemData,
        IdItemData,
        TypedItemData<ActionType>,
        DamagingItemData,
        ModalityItemData {
    /**
     * The id of the Ancestry this Talent belongs to.
     */
    ancestry?: string;
}

export class ActionItemDataModel extends DataModelMixin<
    ActionItemData,
    CosmereItem
>(
    IdItemMixin({
        initialFromName: true,
    }),
    TypedItemMixin({
        initial: ActionType.Basic,
        choices: () =>
            Object.entries(CONFIG.COSMERE.action.types).reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {} as Record<ActionType, string>,
            ),
    }),
    DescriptionItemMixin({
        value: 'COSMERE.Item.Type.Action.desc_placeholder',
    }),
    ActivatableItemMixin(),
    DamagingItemMixin(),
    ModalityItemMixin(),
) {
    static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            ancestry: new foundry.data.fields.StringField({
                required: false,
                nullable: true,
                initial: null,
                label: 'COSMERE.Item.Action.Ancestry.Label',
                hint: 'COSMERE.Item.Action.Ancestry.Hint',
            }),
        });
    }
}
