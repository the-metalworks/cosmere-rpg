import { CosmereItem } from '@system/documents';

// Item event system
import { Rule } from '../event-system';
import { RuleField } from '../event-system/fields/rule-field';

// Fields
import { CollectionField } from '@system/data/fields';

export interface EventsItemData {
    events: Collection<Rule>;
}

export function EventsItemMixin<P extends CosmereItem>() {
    return (base: typeof foundry.abstract.TypeDataModel<EventsItemData, P>) => {
        return class extends base {
            static defineSchema() {
                return foundry.utils.mergeObject(super.defineSchema(), {
                    events: new CollectionField(new RuleField(), {
                        required: true,
                    }),
                });
            }
        };
    };
}
