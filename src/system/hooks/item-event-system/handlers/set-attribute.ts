import { Attribute } from '@system/types/cosmere';
import { HandlerType, Event } from '@system/types/item/events';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

interface SetAttributeHandlerConfigData {
    /**
     * The attribute to set
     */
    attribute: Attribute;

    /**
     * The value to set the attribute to
     */
    value: number;

    /**
     * Whether to set the attribute bonus instead of the attribute itself
     * @default false
     */
    bonus: boolean;
}

// TODO: Localization
export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        type: HandlerType.SetAttribute,
        label: 'Set Attribute',
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
                value: new foundry.data.fields.NumberField({
                    required: true,
                    initial: 1,
                    integer: true,
                    label: 'Value',
                    hint: 'The value to set the attribute to.',
                }),
                bonus: new foundry.data.fields.BooleanField({
                    required: true,
                    initial: false,
                    label: 'Set Bonus',
                    hint: 'Whether to set the attribute bonus instead of the attribute itself.',
                }),
            },
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_SET_ATTRIBUTE}`,
        },
        executor: async function (
            this: SetAttributeHandlerConfigData,
            event: Event,
        ) {
            if (!event.item.actor) return;

            // Get the actor
            const actor = event.item.actor;

            // Modify the attribute
            await actor.update({
                [`system.attributes.${this.attribute}`]: {
                    [this.bonus ? 'bonus' : 'value']: this.value,
                },
            });
        },
    });
}
