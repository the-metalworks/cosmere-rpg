import { ItemType } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents/item';

import { WeaponItemDataModel } from './weapon';
import { ArmorItemDataModel } from './armor';
import { EquipmentItemDataModel } from './equipment';
import { LootItemDataModel } from './loot';

import { AncestryItemDataModel } from './ancestry';
import { CultureItemDataModel } from './culture';
import { PathItemDataModel } from './path';
import { TalentItemDataModel } from './talent';
import { TraitItemDataModel } from './trait';

import { ActionItemDataModel } from './action';

import { InjuryItemDataModel } from './injury';
import { ConnectionItemDataModel } from './connection';
import { GoalItemDataModel } from './goal';

import { PowerItemDataModel } from './power';

import { TalentTreeItemDataModel } from './talent-tree';

export const config = {
    [ItemType.Weapon]: WeaponItemDataModel,
    [ItemType.Armor]: ArmorItemDataModel,
    [ItemType.Equipment]: EquipmentItemDataModel,
    [ItemType.Loot]: LootItemDataModel,

    [ItemType.Ancestry]: AncestryItemDataModel,
    [ItemType.Culture]: CultureItemDataModel,
    [ItemType.Path]: PathItemDataModel,
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
export * from './talent';
export * from './action';
export * from './injury';
export * from './connection';
export * from './trait';
export * from './goal';
export * from './power';
export * from './talent-tree';

declare module "@league-of-foundry-developers/foundry-vtt-types/configuration" {
    interface DataModelConfig {
        Item: {
            [ItemType.Weapon]: typeof WeaponItemDataModel,
            [ItemType.Armor]: typeof ArmorItemDataModel
            [ItemType.Equipment]: typeof EquipmentItemDataModel
            [ItemType.Loot]: typeof LootItemDataModel

            [ItemType.Ancestry]: typeof AncestryItemDataModel
            [ItemType.Culture]: typeof CultureItemDataModel
            [ItemType.Path]: typeof PathItemDataModel
            [ItemType.Talent]: typeof TalentItemDataModel
            [ItemType.Trait]: typeof TraitItemDataModel

            [ItemType.Action]: typeof ActionItemDataModel

            [ItemType.Injury]: typeof InjuryItemDataModel
            [ItemType.Connection]: typeof ConnectionItemDataModel
            [ItemType.Goal]: typeof GoalItemDataModel

            [ItemType.Power]: typeof PowerItemDataModel

            [ItemType.TalentTree]: typeof TalentTreeItemDataModel
        }
    }
}