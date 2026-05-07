import { CosmereItem } from '@system/documents/item';
import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheet, BaseItemSheetRenderContext } from '../base';

export class ItemHeaderComponent extends HandlebarsApplicationComponent<// typeof BaseItemSheet
// TODO: Resolve typing issues
// NOTE: Use any as workaround for foundry-vtt-types issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
any> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_BASE_HEADER}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'edit-image': this.onEditImg,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */
    private static onEditImg(this: ItemHeaderComponent) {
        if (!this.application.isEditable) return;

        const { img: defaultImg } = CosmereItem.getDefaultArtwork(
            this.application.item.toObject(),
        );

        void new foundry.applications.apps.FilePicker.implementation({
            current: this.application.item.img!,
            type: 'image',
            redirectToRoot: [defaultImg],
            callback: (path) => {
                void this.application.item.update({
                    img: path,
                });
            },
        }).browse();
    }

    /* --- Context --- */

    public _prepareContext(params: never, context: BaseItemSheetRenderContext) {
        const item = this.application.item; // TEMP: Workaround

        return Promise.resolve({
            ...context,

            typeLabel: CONFIG.COSMERE.items.types[item.type].label,
        });
    }
}

// Register the component
ItemHeaderComponent.register('app-item-header');
