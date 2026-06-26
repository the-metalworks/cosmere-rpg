import { SYSTEM_ID } from '@system/constants';

const LANGUAGES = [
    {
        id: 'lang_alethi',
        label: 'Alethi',
    },
    {
        id: 'lang_azish',
        label: 'Azish',
    },
    {
        id: 'lang_herdazian',
        label: 'Herdazian',
    },
    {
        id: 'lang_thaylen',
        label: 'Thaylen',
    },
    {
        id: 'lang_unkalaki',
        label: 'Unkalaki',
    },
    {
        id: 'lang_veden',
        label: 'Veden',
    },
];

export function register() {
    LANGUAGES.forEach((config) =>
        cosmereRPG.api.registerLanguage({
            ...config,
            source: SYSTEM_ID,
            priority: -1,
        }),
    );
}
