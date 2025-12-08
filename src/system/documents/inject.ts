import { SystemEmbeddedCollectionsMixin } from './mixins/system-embedded-collections';
import { SystemEmbeddableMixin } from './mixins/system-embeddable';

globalThis.Item = SystemEmbeddedCollectionsMixin(SystemEmbeddableMixin(Item), {
    Item: 'items',
    // Actor: 'actors',
});
globalThis.Actor = SystemEmbeddedCollectionsMixin(
    SystemEmbeddableMixin(Actor),
    {
        Actor: 'actors',
    },
);
