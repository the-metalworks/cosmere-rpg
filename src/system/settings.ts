export function registerSettings() {
    game.settings!.register('cosmere-rpg', 'firstTimeWorldCreation', {
        name: 'First Time World Creation',
        scope: 'world',
        config: false,
        default: true,
        type: Boolean,
    });

    game.settings!.register('cosmere-rpg', 'latestVersion', {
        name: 'Latest Version',
        scope: 'world',
        config: false,
        default: '0.0.0',
        type: String,
    });

    game.settings!.register('cosmere-rpg', 'itemSheetSideTabs', {
        name: 'Vertical Side Tabs for Item Sheets',
        hint: 'Toggle whether Item sheets should use vertical tabs down the right-hand side, similar to the character sheet, or leave the in-line horizontal ones (default).',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
    });
}
