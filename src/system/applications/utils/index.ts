import { CosmereActor } from '@system/documents/actor';
import { CosmereItem } from '@system/documents/item';

export function getItemIdFromEvent(event: Event): string | undefined {
    if (!event.target && !event.currentTarget) return;

    const element = $(event.target ?? event.currentTarget!).closest(
        '.item[data-item-id]',
    );
    if (element.length === 0) return;

    return element.data('item-id') as string;
}

export function getItemUuidFromEvent(event: Event): string | undefined {
    if (!event.target && !event.currentTarget) return;

    const element = $(event.target ?? event.currentTarget!).closest(
        '.item[data-item-uuid]',
    );
    if (element.length === 0) return;

    return element.data('item-uuid') as string;
}

export async function getItemFromEvent(
    event: Event,
    actor: CosmereActor,
): Promise<CosmereItem | null> {
    // Get uuid
    const uuid = getItemUuidFromEvent(event);
    if (!uuid) return null;

    // Find the item
    return foundry.utils.fromUuid<CosmereItem>(uuid);
}

export async function getItemFromElement(
    element: HTMLElement,
    actor: CosmereActor,
): Promise<CosmereItem | null> {
    // Get the uuid
    const uuid = $(element)
        .closest('.item[data-item-uuid]')
        .data('item-uuid') as string;

    // Find the item
    return foundry.utils.fromUuid<CosmereItem>(uuid);
}

export default {
    getItemIdFromEvent,
    getItemUuidFromEvent,
    getItemFromEvent,
    getItemFromElement,
};
