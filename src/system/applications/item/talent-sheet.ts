import { Talent } from '@system/types/item';
import { TalentItem } from '@system/documents/item';
import { DeepPartial } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Base
import { BaseItemSheet } from './base';

export class TalentItemSheet extends BaseItemSheet {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            classes: [SYSTEM_ID, 'sheet', 'item', 'talent'],
            position: {
                width: 550,
            },
            window: {
                resizable: false,
                positioned: true,
            },
            form: {
                handler: this.onFormEvent,
            } as unknown,
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    static TABS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.TABS),
        {
            details: {
                label: 'COSMERE.Item.Sheet.Tabs.Details',
                icon: '<i class="fa-solid fa-circle-info"></i>',
                sortIndex: 15,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            content: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_TALENT_CONTENT}`,
            },
        },
    );

    get item(): TalentItem {
        return super.document;
    }

    /* --- Form --- */

    protected static async onFormEvent(
        this: TalentItemSheet,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (
            'system.path' in formData.object &&
            formData.object['system.path'] === ''
        )
            formData.set('system.path', null);

        // Invoke super
        await super.onFormEvent(event, form, formData);
    }

    /* --- Context --- */

    public async _prepareContext(
        options: DeepPartial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        return {
            ...(await super._prepareContext(options)),
            isPathTalent: this.item.system.type === Talent.Type.Path,
            isAncestryTalent: this.item.system.type === Talent.Type.Ancestry,
            isPowerTalent: this.item.system.type === Talent.Type.Power,
            hasModality: this.item.system.modality !== null,
        };
    }
}
