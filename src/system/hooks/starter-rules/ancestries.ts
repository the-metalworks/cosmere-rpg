import { SYSTEM_ID } from '@system/constants';

export const ANCESTRIES = [
    {
        id: 'human',
        label: 'COSMERE.Objects.Generic.Ancestry.Human',
        reference: 'Compendium.cosmere-rpg.ancestries.Item.q7t6vnxXBXDvsfhc',
    },
];

export function register() {
    ANCESTRIES.forEach((config) =>
        cosmereRPG.api.registerAncestry({
            ...config,
            source: SYSTEM_ID,
            priority: -1,
        }),
    );
}
