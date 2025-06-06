import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheet, BaseItemSheetRenderContext } from '../base';

export class DetailsLinkedSkillsComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseItemSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_DETAILS_LINKED_SKILLS}`;

    /* --- Context --- */

    public _prepareContext(params: never, context: BaseItemSheetRenderContext) {
        const hasLinkedSkills = this.application.item.hasLinkedSkills();
        if (!hasLinkedSkills)
            return Promise.resolve({ ...context, hasLinkedSkills });

        let linkedSkillsOptions = (
            (
                (
                    this.application.item
                        .system as unknown as foundry.abstract.DataModel
                ).schema.getField(
                    'linkedSkills',
                ) as foundry.data.fields.ArrayField
            ).element as foundry.data.fields.StringField
        ).choices;

        if (linkedSkillsOptions instanceof Function)
            linkedSkillsOptions = linkedSkillsOptions();

        return Promise.resolve({
            ...context,
            hasLinkedSkills,
            linkedSkillsOptions,
        });
    }
}

// Register the component
DetailsLinkedSkillsComponent.register('app-item-details-linked-skills');
