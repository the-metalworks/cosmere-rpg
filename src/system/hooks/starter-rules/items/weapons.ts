import { SYSTEM_ID } from '@system/constants';

const WEAPONS = [
    {
        id: 'axe',
        label: 'COSMERE.Objects.Stormlight.Weapon.Axe',
        reference: 'Compendium.cosmere-rpg.items.Item.C4o8jIXuVulD9qS9',
    },
    {
        id: 'hammer',
        label: 'COSMERE.Objects.Stormlight.Weapon.Hammer',
        reference: 'Compendium.cosmere-rpg.items.Item.OBPoBfwLrZg0Unz6',
    },
    {
        id: 'knife',
        label: 'COSMERE.Objects.Stormlight.Weapon.Knife',
        reference: 'Compendium.cosmere-rpg.items.Item.k0aKCdFJU0m2lZbv',
    },
    {
        id: 'longsword',
        label: 'COSMERE.Objects.Stormlight.Weapon.Longsword',
        reference: 'Compendium.cosmere-rpg.items.Item.yzR4gLjOV6njxdde',
    },
    {
        id: 'longspear',
        label: 'COSMERE.Objects.Stormlight.Weapon.Longspear',
        reference: 'Compendium.cosmere-rpg.items.Item.ex4dg2bXFpC5HTv6',
    },
    {
        id: 'mace',
        label: 'COSMERE.Objects.Stormlight.Weapon.Mace',
        reference: 'Compendium.cosmere-rpg.items.Item.5sH5poLPx75U008u',
    },
    {
        id: 'shield',
        label: 'COSMERE.Objects.Stormlight.Weapon.Shield',
        reference: 'Compendium.cosmere-rpg.items.Item.fV3Adif5imyAc5m5',
    },
    {
        id: 'shortbow',
        label: 'COSMERE.Objects.Stormlight.Weapon.Shortbow',
        reference: 'Compendium.cosmere-rpg.items.Item.VuNjyCtkobEQKdOx',
    },
    {
        id: 'shortspear',
        label: 'COSMERE.Objects.Stormlight.Weapon.Shortspear',
        reference: 'Compendium.cosmere-rpg.items.Item.5CvSwkwuSRArPTM2',
    },
    {
        id: 'sidesword',
        label: 'COSMERE.Objects.Stormlight.Weapon.Sidesword',
        reference: 'Compendium.cosmere-rpg.items.Item.0mE1SpjOuNtgR0eq',
    },
    {
        id: 'staff',
        label: 'COSMERE.Objects.Stormlight.Weapon.Staff',
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
