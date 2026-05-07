import { EmbedConfigMixin } from './mixin';

globalThis.Item = EmbedConfigMixin(Item);

foundry.utils.setProperty(foundry, 'documents.Item', globalThis.Item);
foundry.utils.setProperty(CONFIG, 'Item.documentClass', globalThis.Item);
