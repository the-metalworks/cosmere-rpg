import './socket';

import { SystemEmbeddedCollectionsMixin } from './mixin';

globalThis.Item = SystemEmbeddedCollectionsMixin(Item, {
    Item: 'items',
});

foundry.documents = {
    ...foundry.documents,
    Item: globalThis.Item,
};

foundry.utils.setProperty(CONFIG, 'Item.documentClass', globalThis.Item);

declare global {
    interface ConfiguredSystemEmbeddedCollections {
        Item: {
            Item: string;
        };
    }
}
