import { CosmereItem } from '@system/documents';

// Item event system
import { Rule, RuleData } from '../event-system';

// Fields
import { CollectionField } from '@system/data/fields';

export interface EventsItemData {
    events: Collection<RuleData>;
}

export function EventsItemMixin<P extends CosmereItem>() {
    return (base: typeof foundry.abstract.TypeDataModel<EventsItemData, P>) => {
        return class extends base {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), {
                    events: new CollectionField(
                        new foundry.data.fields.SchemaField(
                            Rule.defineSchema(),
                        ),
                        {
                            required: true,
                        },
                    ),
                });
            }
        };
    };
}
