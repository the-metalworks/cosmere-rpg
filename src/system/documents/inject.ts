import { SystemEmbeddedCollectionsMixin } from './mixins/system-embedded-collections';

globalThis.Item = SystemEmbeddedCollectionsMixin(Item, {
    Item: 'items',
});

foundry.documents = {
    ...foundry.documents,
    Item: globalThis.Item,
};
