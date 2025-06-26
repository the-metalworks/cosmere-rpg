// Types
import { ItemType } from '@system/types/cosmere';
import { EmbedHelpers } from '../types';

// Embedders
import talentEmbed from './talent';
import talentTreeEmbed from './talent-tree';

const EMBEDDERS: Record<ItemType, EmbedHelpers> = {
    [ItemType.Weapon]: {},
    [ItemType.Armor]: {},
    [ItemType.Equipment]: {},
    [ItemType.Loot]: {},

    [ItemType.Ancestry]: {},
    [ItemType.Culture]: {},
    [ItemType.Path]: {},
    [ItemType.Specialty]: {},
    [ItemType.Talent]: talentEmbed,
    [ItemType.Trait]: {},

    [ItemType.Action]: {},

    [ItemType.Injury]: {},
    [ItemType.Connection]: {},
    [ItemType.Goal]: {},

    [ItemType.Power]: {},

    [ItemType.TalentTree]: talentTreeEmbed,
};

export function getEmbedHelpers(type: ItemType) {
    return EMBEDDERS[type] ?? {};
}

export default getEmbedHelpers;
