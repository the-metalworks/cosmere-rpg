import { Attribute } from '@system/types/cosmere';
import { HandlerType, Event } from '@system/types/item/events';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

interface ModifyAttributeHandlerConfigData {
    /**
     * The attribute to modify
     */
    attribute: Attribute;

    /**
     * The amount to modify the attribute by
     */
    amount: number;

    /**
     * Whether to modify the attribute bonus instead of the attribute itself
     * @default false
     */
    bonus: boolean;
}

// TODO: Localization
export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        type: HandlerType.ModifyAttribute,
        label: 'Modify Attribute',
        config: {
            schema: {
                attribute: new foundry.data.fields.StringField({
                    required: true,
                    blank: false,
                    initial: () => Object.keys(CONFIG.COSMERE.attributes)[0],
                    choices: () =>
                        Object.entries(CONFIG.COSMERE.attributes)
                            .map(([attrId, config]) => [attrId, config.label])
                            .reduce(
                                (acc, [key, value]) => ({
                                    ...acc,
                                    [key]: value,
                                }),
                                {},
                            ),
                    label: 'Attribute',
                }),
                amount: new foundry.data.fields.NumberField({
                    required: true,
                    initial: 1,
                    integer: true,
                    label: 'Amount',
                    hint: 'The amount to modify (increase/decrease) the attribute by.',
                }),
                bonus: new foundry.data.fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'Modify Bonus',
                    hint: 'Whether to modify the attribute bonus instead of the attribute itself.',
                }),
            },
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_MODIFY_ATTRIBUTE}`,
        },
        executor: async function (
            this: ModifyAttributeHandlerConfigData,
            event: Event,
        ) {
            if (!event.item.actor) return;
            if (this.amount === 0) return;

            // Get the actor
            const actor = event.item.actor;

            // Modify the attribute
            await actor.update({
                [`system.attributes.${this.attribute}`]: {
                    [this.bonus ? 'bonus' : 'value']:
                        actor.system.attributes[this.attribute][
                            this.bonus ? 'bonus' : 'value'
                        ] + this.amount,
                },
            });
        },
    });
}
