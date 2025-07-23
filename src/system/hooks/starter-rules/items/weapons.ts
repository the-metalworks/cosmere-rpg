import { SYSTEM_ID } from '@system/constants';

const WEAPONS = [
    {
        id: 'axe',
        label: 'Axe',
        reference: 'Compendium.cosmere-rpg.items.Item.C4o8jIXuVulD9qS9',
    },
    {
        id: 'hammer',
        label: 'Hammer',
        reference: 'Compendium.cosmere-rpg.items.Item.OBPoBfwLrZg0Unz6',
    },
    {
        id: 'knife',
        label: 'Knife',
        reference: 'Compendium.cosmere-rpg.items.Item.k0aKCdFJU0m2lZbv',
    },
    {
        id: 'longsword',
        label: 'Longsword',
        reference: 'Compendium.cosmere-rpg.items.Item.yzR4gLjOV6njxdde',
    },
    {
        id: 'longspear',
        label: 'Longspear',
        reference: 'Compendium.cosmere-rpg.items.Item.ex4dg2bXFpC5HTv6',
    },
    {
        id: 'mace',
        label: 'Mace',
        reference: 'Compendium.cosmere-rpg.items.Item.5sH5poLPx75U008u',
    },
    {
        id: 'shield',
        label: 'Shield',
        reference: 'Compendium.cosmere-rpg.items.Item.fV3Adif5imyAc5m5',
    },
    {
        id: 'shortbow',
        label: 'Shortbow',
        reference: 'Compendium.cosmere-rpg.items.Item.VuNjyCtkobEQKdOx',
    },
    {
        id: 'shortspear',
        label: 'Shortspear',
        reference: 'Compendium.cosmere-rpg.items.Item.5CvSwkwuSRArPTM2',
    },
    {
        id: 'sidesword',
        label: 'Sidesword',
        reference: 'Compendium.cosmere-rpg.items.Item.0mE1SpjOuNtgR0eq',
    },
    {
        id: 'staff',
        label: 'Staff',
        reference: 'Compendium.cosmere-rpg.items.Item.zyDACVYDa0N9N31r',
    },
];

export function register() {
    WEAPONS.forEach((config) =>
        cosmereRPG.api.registerWeapon({
            ...config,
            source: SYSTEM_ID,
            priority: -1,
        }),
    );
}
