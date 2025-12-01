import { PseudoEmbeddedCollectionsMixin } from './mixins/pseudo-embedded-collections';
import { PseudoEmbeddableMixin } from './mixins/pseudo-embeddable';

globalThis.Item = PseudoEmbeddableMixin(PseudoEmbeddedCollectionsMixin(Item));
