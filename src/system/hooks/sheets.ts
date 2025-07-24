import { BaseItemSheet } from '../applications/item/base';

Hooks.on(
    'renderItemSheetV2',
    (itemSheet: BaseItemSheet, node: HTMLFormElement) => {
        if (game.settings!.get('cosmere-rpg', 'itemSheetSideTabs')) {
            node.classList.add('side-tabs');
        }
    },
);
