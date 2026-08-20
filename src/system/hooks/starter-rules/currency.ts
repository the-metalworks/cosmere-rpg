import { SYSTEM_ID } from '@system/constants';

export function register() {
    const secondary = [
        {
            id: 'diamond',
            label: 'COSMERE.Objects.Stormlight.Currency.Diamond',
            conversionRate: 1,
            base: true,
        },
        {
            id: 'garnet',
            label: 'COSMERE.Objects.Stormlight.Currency.Garnet',
            conversionRate: 5,
        },
        {
            id: 'heliodor',
            label: 'COSMERE.Objects.Stormlight.Currency.Heliodor',
            conversionRate: 5,
        },
        {
            id: 'topaz',
            label: 'COSMERE.Objects.Stormlight.Currency.Topaz',
            conversionRate: 5,
        },
        {
            id: 'ruby',
            label: 'COSMERE.Objects.Stormlight.Currency.Ruby',
            conversionRate: 10,
        },
        {
            id: 'smokestone',
            label: 'COSMERE.Objects.Stormlight.Currency.Smokestone',
            conversionRate: 10,
        },
        {
            id: 'zircon',
            label: 'COSMERE.Objects.Stormlight.Currency.Zircon',
            conversionRate: 10,
        },
        {
            id: 'amethyst',
            label: 'COSMERE.Objects.Stormlight.Currency.Amethyst',
            conversionRate: 25,
        },
        {
            id: 'sapphire',
            label: 'COSMERE.Objects.Stormlight.Currency.Sapphire',
            conversionRate: 25,
        },
        {
            id: 'emerald',
            label: 'COSMERE.Objects.Stormlight.Currency.Emerald',
            conversionRate: 50,
        },
    ];

    cosmereRPG.api.registerCurrency({
        source: SYSTEM_ID,
        id: 'spheres',
        label: 'COSMERE.Objects.Stormlight.Currency.Spheres',
        icon: 'systems/cosmere-rpg/assets/icons/stormlight/currency/spheres_infused.webp',
        denominations: {
            primary: [
                {
                    id: 'mark',
                    label: 'COSMERE.Objects.Stormlight.Currency.Mark',
                    unit: 'mk ●',
                    conversionRate: 1,
                    base: true,
                },
                {
                    id: 'chip',
                    label: 'COSMERE.Objects.Stormlight.Currency.Chip',
                    conversionRate: 0.2,
                },
                {
                    id: 'broam',
                    label: 'COSMERE.Objects.Stormlight.Currency.Broam',
                    conversionRate: 4,
                },
            ],
            secondary,
        },
        priority: -1,
    });
}
