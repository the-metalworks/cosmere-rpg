import { makePseudoDocumentClass } from './document';

export const PseudoItem = makePseudoDocumentClass('Item');
export type PseudoItem = InstanceType<typeof PseudoItem>;
