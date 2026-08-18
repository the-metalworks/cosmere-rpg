import './socket';

import { SystemEmbeddedCollectionsMixin, adventureMixin } from './mixin';

globalThis.Item = SystemEmbeddedCollectionsMixin(Item, {
    Item: 'items',
});
foundry.documents = {
    ...foundry.documents,
    Item: globalThis.Item,
};
foundry.utils.setProperty(CONFIG, 'Item.documentClass', globalThis.Item);

globalThis.Adventure = adventureMixin(Adventure, {
    items: Item,
});
foundry.utils.setProperty(foundry.documents, 'adventure', globalThis.Adventure);
foundry.utils.setProperty(
    CONFIG,
    'Adventure.documentClass',
    globalThis.Adventure,
);

declare global {
    interface ConfiguredSystemEmbeddedCollections {
        Item: {
            Item: string;
        };
    }
}
