import { Attribute } from '@system/types/cosmere';
import { HandlerType, Event } from '@system/types/item/event-system';

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

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.SetAttribute,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.SetAttribute}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.SetAttribute}.Description`,
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
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.SetAttribute}.Attribute.Label`,
                }),
                value: new foundry.data.fields.NumberField({
                    required: true,
                    initial: 1,
                    integer: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.SetAttribute}.Value.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.SetAttribute}.Value.Hint`,
                }),
                bonus: new foundry.data.fields.BooleanField({
                    required: true,
                    initial: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.SetAttribute}.Bonus.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.SetAttribute}.Bonus.Hint`,
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
            await actor.update(
                {
                    [`system.attributes.${this.attribute}`]: {
                        [this.bonus ? 'bonus' : 'value']: this.value,
                    },
                },
                event.op,
            );
        },
    });
}
