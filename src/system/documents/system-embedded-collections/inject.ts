import './socket';

import { SystemEmbeddedCollectionsMixin } from './mixin';

globalThis.Item = SystemEmbeddedCollectionsMixin(Item, {
    Item: 'items',
});

foundry.documents = {
    ...foundry.documents,
    Item: globalThis.Item,
};
