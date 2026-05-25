import type { CosmereActor } from '@system/documents/actor';
import type { CosmereItem } from '@system/documents/item';

export function getItemIdFromEvent(event: Event): string | undefined {
    if (!event.target && !event.currentTarget) return;

    const element = $(event.target ?? event.currentTarget!).closest(
        '.item[data-item-id]',
    );
    if (element.length === 0) return;

    return element.data('item-id') as string;
}

export function getItemFromEvent(
    event: Event,
    actor: CosmereActor,
): CosmereItem | undefined {
    // Get id
    const itemId = getItemIdFromEvent(event);

    // Find the item
    return actor.items.find((i) => i.id === itemId);
}

export function getItemFromElement(
    element: HTMLElement,
    actor: CosmereActor,
): CosmereItem | undefined {
    // Get the id
    const itemId = $(element)
        .closest('.item[data-item-id]')
        .data('item-id') as string;

    // Find the item
    return actor.items.find((i) => i.id === itemId);
}

export default {
    getItemIdFromEvent,
    getItemFromEvent,
    getItemFromElement,
};
