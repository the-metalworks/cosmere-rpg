import { EquipHand, HoldType } from '@system/types/cosmere';

import { CosmereItem, WeaponItem, ArmorItem } from '@system/documents/item';

export const enum ItemTarget {
    Self = 'self',
    Sibling = 'sibling',
    EquippedWeapon = 'equipped-weapon',
    EquippedArmor = 'equipped-armor',
    Global = 'global',
}

export const enum MatchMode {
    Identifier = 'identifier',
    Name = 'name',
    UUID = 'uuid',
}

export async function matchItems(
    item: CosmereItem,
    target: ItemTarget,
    uuid: string | null,
    matchMode: MatchMode | null,
    matchAll: boolean | null,
) {
    if (target === ItemTarget.Self) {
        return [item];
    } else if (target === ItemTarget.Sibling && item.actor && uuid) {
        // Look up the reference item from uuid
        const referenceItem = (await fromUuid(uuid)) as CosmereItem | null;
        if (!referenceItem) return [];

        const siblings = item.actor.items;

        // Determine the match mode
        matchMode =
            matchMode === MatchMode.Identifier && !referenceItem.hasId()
                ? MatchMode.Name
                : matchMode;

        // Get the matcher function
        const matcher =
            matchMode === MatchMode.Identifier
                ? getIdentifierMatcher(referenceItem)
                : matchMode === MatchMode.Name
                  ? getNameMatcher(referenceItem)
                  : getUUIDMatcher(referenceItem);

        // Get the items to update
        return matchAll
            ? siblings.filter(matcher)
            : [siblings.find(matcher)].filter((item) => !!item);
    } else if (target === ItemTarget.EquippedWeapon && item.actor) {
        const condition = (item: CosmereItem) =>
            item.isWeapon() && item.system.equipped;

        return matchAll
            ? item.actor.items.filter(condition)
            : [
                  (item.actor.items.filter(condition) as WeaponItem[])
                      .sort(compareWeaponEquipType)
                      .find(() => true),
              ].filter((item) => !!item);
    } else if (target === ItemTarget.EquippedArmor && item.actor) {
        const condition = (item: CosmereItem) =>
            item.isArmor() && item.system.equipped;

        return matchAll
            ? item.actor.items.filter(condition)
            : [item.actor.items.find(condition)].filter((item) => !!item);
    } else if (target === ItemTarget.Global && uuid) {
        // Look up the target item from uuid
        return [(await fromUuid(uuid)) as CosmereItem | null].filter(
            (item) => !!item,
        );
    } else {
        throw new Error('Invalid target');
    }
}

function getIdentifierMatcher(referenceItem: CosmereItem) {
    return (item: CosmereItem) =>
        item.hasId() && item.system.id === referenceItem.system.id;
}

function getNameMatcher(referenceItem: CosmereItem) {
    return (item: CosmereItem) => item.name === referenceItem.name;
}

function getUUIDMatcher(referenceItem: CosmereItem) {
    return (item: CosmereItem) => item.uuid === referenceItem.uuid;
}

function compareWeaponEquipType(a: WeaponItem, b: WeaponItem) {
    const holdA = a.system.equip.hold;
    const holdB = b.system.equip.hold;

    if (holdA === HoldType.TwoHanded) return -1;
    if (holdB === HoldType.TwoHanded) return 1;

    const handA = a.system.equip.hand;
    const handB = b.system.equip.hand;

    if (handA === EquipHand.Main && handB === EquipHand.Off) return -1;
    if (handA === EquipHand.Off && handB === EquipHand.Main) return 1;

    return 0;
}
