import { AnyMutableObject, CosmereDocument } from '@system/types/utils';

export function activateListeners() {
    const body = $('body');
    body.on('dragstart', 'section[data-link]', _onDragContentLink);
}

/**
 * Begin a Drag+Drop workflow for a dynamic content link
 * @param event   The originating drag event
 * @private
 */
function _onDragContentLink(event: JQueryEventObject) {
    event.stopPropagation();
    const a = event.currentTarget as HTMLElement;
    let dragData: AnyMutableObject | null = null;

    // Case 1 - Compendium Link
    if (a.dataset.pack) {
        const pack = game.packs!.get(a.dataset.pack)!;
        let id = a.dataset.id;
        if (a.dataset.lookup && pack.index.size) {
            const entry = pack.index.find(
                (i) =>
                    i._id === a.dataset.lookup ||
                    (i as unknown as { name: string }).name ===
                        a.dataset.lookup,
            );
            if (entry) id = entry._id;
        }
        if (!a.dataset.uuid && !id) return false;
        const uuid = a.dataset.uuid ?? pack.getUuid(id!);
        dragData = { type: a.dataset.type ?? pack.documentName, uuid };
    }

    // Case 2 - World Document Link
    else {
        const doc = fromUuidSync(a.dataset.uuid!) as CosmereDocument;
        dragData = doc.toDragData() as AnyMutableObject;
    }

    (event.originalEvent as DragEvent).dataTransfer!.setData(
        'text/plain',
        JSON.stringify(dragData),
    );
}

export default {
    activateListeners,
};
