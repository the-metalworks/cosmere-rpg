// Types
import { ItemType } from '@system/types/cosmere';
import { EmbedHelpers } from '../types';

// Embedders
import cultureEmbed from './culture';
import talentEmbed from './talent';
import talentTreeEmbed from './talent-tree';
import actionEmbed from './action';
import pathEmbed from './path';

const EMBEDDERS: Record<ItemType, EmbedHelpers> = {
    [ItemType.Weapon]: {},
    [ItemType.Armor]: {},
    [ItemType.Equipment]: {},
    [ItemType.Loot]: {},

    [ItemType.Ancestry]: {},
    [ItemType.Culture]: cultureEmbed,
    [ItemType.Path]: pathEmbed,
    [ItemType.Specialty]: {},
    [ItemType.Talent]: talentEmbed,
    [ItemType.Trait]: {},

    [ItemType.Action]: actionEmbed,

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
