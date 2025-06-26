import { CosmereItem } from '@system/documents/item';

// Embed helpers
import getItemEmbedHelpers from './item';

export function getEmbedHelpers(document: foundry.abstract.Document) {
    switch (document.documentName) {
        case 'Item':
            return getItemEmbedHelpers((document as CosmereItem).type);
        default:
            return {}; // No embed helpers available for this document type
    }
}

export default getEmbedHelpers;
