import { SYSTEM_ID } from '@system/constants';

const CULTURES = [
    {
        id: 'alethi',
        label: 'COSMERE.Objects.Stormlight.Culture.Alethi',
        reference: 'Compendium.cosmere-rpg.cultures.Item.oWJSlmauhHG57LrO',
    },
    {
        id: 'azish',
        label: 'COSMERE.Objects.Stormlight.Culture.Azish',
        reference: 'Compendium.cosmere-rpg.cultures.Item.PbkgODW2av4tBPdW',
    },
    {
        id: 'herdazian',
        label: 'COSMERE.Objects.Stormlight.Culture.Herdazian',
        reference: 'Compendium.cosmere-rpg.cultures.Item.nIOHtV8KoTdKH4FQ',
    },
    {
        id: 'thaylen',
        label: 'COSMERE.Objects.Stormlight.Culture.Thaylen',
        reference: 'Compendium.cosmere-rpg.cultures.Item.yuZdO7YSfydUAdhu',
    },
    {
        id: 'unkalaki',
        label: 'COSMERE.Objects.Stormlight.Culture.Unkalaki',
        reference: 'Compendium.cosmere-rpg.cultures.Item.RDD4CJzcnb2mjXXC',
    },
    {
        id: 'veden',
        label: 'COSMERE.Objects.Stormlight.Culture.Veden',
        reference: 'Compendium.cosmere-rpg.cultures.Item.ZVXjqw4l30mNjAdq',
    },
];

export function register() {
    CULTURES.forEach((config) =>
        cosmereRPG.api.registerCulture({
            ...config,
            source: SYSTEM_ID,
            priority: -1,
        }),
    );
}
