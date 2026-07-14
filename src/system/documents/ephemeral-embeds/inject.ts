import { EphemeralEmbeddedDocumentsMixin } from './mixin';

globalThis.Item = EphemeralEmbeddedDocumentsMixin(Item);

foundry.utils.setProperty(foundry, 'documents.Item', globalThis.Item);
foundry.utils.setProperty(CONFIG, 'Item.documentClass', globalThis.Item);
