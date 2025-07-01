// Types
import { ItemType } from '@system/types/cosmere';
import { EmbedHelpers } from '../types';

// Embedders
import talentEmbed from './talent';
import talentTreeEmbed from './talent-tree';
import pathEmbed from './path';
import ancestryEmbed from './ancestry';
import genericEmbed from './generic';

const EMBEDDERS: Record<ItemType, EmbedHelpers | null> = {
    [ItemType.Weapon]: null,
    [ItemType.Armor]: null,
    [ItemType.Equipment]: null,
    [ItemType.Loot]: null,

    [ItemType.Ancestry]: ancestryEmbed,
    [ItemType.Culture]: null,
    [ItemType.Path]: pathEmbed,
    [ItemType.Specialty]: null,
    [ItemType.Talent]: talentEmbed,
    [ItemType.Trait]: null,

    [ItemType.Action]: null,

    [ItemType.Injury]: null,
    [ItemType.Connection]: null,
    [ItemType.Goal]: null,

    [ItemType.Power]: null,

    [ItemType.TalentTree]: talentTreeEmbed,
};

export function getEmbedHelpers(type: ItemType): EmbedHelpers {
    return EMBEDDERS[type] ?? genericEmbed;
}

export default getEmbedHelpers;
