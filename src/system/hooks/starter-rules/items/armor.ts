import { SYSTEM_ID } from '@system/constants';

const ARMOR = [
    {
        id: 'breastplate',
        label: 'COSMERE.Objects.Stormlight.Armor.Breastplate',
        reference: 'Compendium.cosmere-rpg.items.Item.xLer8raOT6EkLfWN',
    },
    {
        id: 'chain',
        label: 'COSMERE.Objects.Stormlight.Armor.Chain',
        reference: 'Compendium.cosmere-rpg.items.Item.6y5hONLMQa4O2wnU',
    },
    {
        id: 'full-plate',
        label: 'COSMERE.Objects.Stormlight.Armor.FullPlate',
        reference: 'Compendium.cosmere-rpg.items.Item.t97DN6FAh7BMNvcP',
    },
    {
        id: 'half-plate',
        label: 'COSMERE.Objects.Stormlight.Armor.HalfPlate',
        reference: 'Compendium.cosmere-rpg.items.Item.GlrRu1goky9ifKCl',
    },
    {
        id: 'leather',
        label: 'COSMERE.Objects.Stormlight.Armor.Leather',
        reference: 'Compendium.cosmere-rpg.items.Item.dxty96So3kGZVhv5',
    },
    {
        id: 'uniform',
        label: 'COSMERE.Objects.Stormlight.Armor.Uniform',
        reference: 'Compendium.cosmere-rpg.items.Item.SRLLAWCE7rwS40Pv',
    },
];

export function register() {
    ARMOR.forEach((config) =>
        cosmereRPG.api.registerArmor({
            ...config,
            source: SYSTEM_ID,
            priority: -1,
        }),
    );
}
