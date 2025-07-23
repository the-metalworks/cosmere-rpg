import { SYSTEM_ID } from '@system/constants';

export function register() {
    const secondary = [
        {
            id: 'diamond',
            label: 'Diamond',
            conversionRate: 1,
            base: true,
        },
        {
            id: 'garnet',
            label: 'Garnet',
            conversionRate: 5,
        },
        {
            id: 'heliodor',
            label: 'Heliodor',
            conversionRate: 5,
        },
        {
            id: 'topaz',
            label: 'Topaz',
            conversionRate: 5,
        },
        {
            id: 'ruby',
            label: 'Ruby',
            conversionRate: 10,
        },
        {
            id: 'smokestone',
            label: 'Smokestone',
            conversionRate: 10,
        },
        {
            id: 'zircon',
            label: 'Zircon',
            conversionRate: 10,
        },
        {
            id: 'amethyst',
            label: 'Amethyst',
            conversionRate: 25,
        },
        {
            id: 'sapphire',
            label: 'Sapphire',
            conversionRate: 25,
        },
        {
            id: 'emerald',
            label: 'Emerald',
            conversionRate: 50,
        },
    ];

    cosmereRPG.api.registerCurrency({
        source: SYSTEM_ID,
        id: 'spheres',
        label: 'STORMLIGHT.Currency.Spheres',
        icon: 'systems/cosmere-rpg/assets/icons/stormlight/currency/spheres_infused.webp',
        denominations: {
            primary: [
                {
                    id: 'mark',
                    label: 'Mark',
                    unit: 'mk ●',
                    conversionRate: 1,
                    base: true,
                },
                {
                    id: 'chip',
                    label: 'Chip',
                    conversionRate: 0.2,
                },
                {
                    id: 'broam',
                    label: 'Broam',
                    conversionRate: 4,
                },
            ],
            secondary,
        },
        priority: -1,
    });
}
