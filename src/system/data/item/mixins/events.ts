import { CosmereItem } from '@system/documents';

// Item event system
import { RuleField } from '../event-system/fields/rule-field';

// Fields
import { CollectionField } from '@system/data/fields';

const SCHEMA = {
    events: new CollectionField(new RuleField(), {
        required: true,
    }),
};

export type EventsItemDataSchema = typeof SCHEMA;
export type EventsItemData = foundry.data.fields.SchemaField.InitializedData<EventsItemDataSchema>;

export function EventsItemMixin<TParent extends foundry.abstract.Document.Any>() {
    return (
        base: typeof foundry.abstract.TypeDataModel) => {
        return class extends base<EventsItemDataSchema, TParent> {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), SCHEMA);
            }
        };
    };
}
