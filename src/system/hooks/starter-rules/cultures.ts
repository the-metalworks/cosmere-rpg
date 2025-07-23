import { SYSTEM_ID } from '@system/constants';

const CULTURES = [
    {
        id: 'alethi',
        label: 'Alethi',
        reference: 'Compendium.cosmere-rpg.cultures.Item.oWJSlmauhHG57LrO',
    },
    {
        id: 'azish',
        label: 'Azish',
        reference: 'Compendium.cosmere-rpg.cultures.Item.PbkgODW2av4tBPdW',
    },
    {
        id: 'herdazian',
        label: 'Herdazian',
        reference: 'Compendium.cosmere-rpg.cultures.Item.nIOHtV8KoTdKH4FQ',
    },
    {
        id: 'thaylen',
        label: 'Thaylen',
        reference: 'Compendium.cosmere-rpg.cultures.Item.yuZdO7YSfydUAdhu',
    },
    {
        id: 'unkalaki',
        label: 'Unkalaki',
        reference: 'Compendium.cosmere-rpg.cultures.Item.RDD4CJzcnb2mjXXC',
    },
    {
        id: 'veden',
        label: 'Veden',
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
