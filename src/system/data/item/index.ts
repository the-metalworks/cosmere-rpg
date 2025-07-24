import { ItemType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents/item';

import { WeaponItemDataModel } from './weapon';
import { ArmorItemDataModel } from './armor';
import { EquipmentItemDataModel } from './equipment';
import { LootItemDataModel } from './loot';

import { AncestryItemDataModel } from './ancestry';
import { CultureItemDataModel } from './culture';
import { PathItemDataModel } from './path';
import { SpecialtyItemDataModel } from './specialty';
import { TalentItemDataModel } from './talent';
import { TraitItemDataModel } from './trait';

import { ActionItemDataModel } from './action';

import { InjuryItemDataModel } from './injury';
import { ConnectionItemDataModel } from './connection';
import { GoalItemDataModel } from './goal';

import { PowerItemDataModel } from './power';

import { TalentTreeItemDataModel } from './talent-tree';

export const config: Record<
    ItemType,
    typeof foundry.abstract.TypeDataModel<
        foundry.abstract.DataModel,
        CosmereItem
    >
> = {
    [ItemType.Weapon]: WeaponItemDataModel,
    [ItemType.Armor]: ArmorItemDataModel,
    [ItemType.Equipment]: EquipmentItemDataModel,
    [ItemType.Loot]: LootItemDataModel,

    [ItemType.Ancestry]: AncestryItemDataModel,
    [ItemType.Culture]: CultureItemDataModel,
    [ItemType.Path]: PathItemDataModel,
    [ItemType.Specialty]: SpecialtyItemDataModel,
    [ItemType.Talent]: TalentItemDataModel,
    [ItemType.Trait]: TraitItemDataModel,

    [ItemType.Action]: ActionItemDataModel,

    [ItemType.Injury]: InjuryItemDataModel,
    [ItemType.Connection]: ConnectionItemDataModel,
    [ItemType.Goal]: GoalItemDataModel,

    [ItemType.Power]: PowerItemDataModel,

    [ItemType.TalentTree]: TalentTreeItemDataModel,
};

export * from './weapon';
export * from './armor';
export * from './equipment';
export * from './loot';
export * from './ancestry';
export * from './culture';
export * from './path';
export * from './specialty';
export * from './talent';
export * from './action';
export * from './injury';
export * from './connection';
export * from './trait';
export * from './goal';
export * from './power';
export * from './talent-tree';
