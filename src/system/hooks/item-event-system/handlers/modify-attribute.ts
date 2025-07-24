import { Attribute } from '@system/types/cosmere';
import { HandlerType, Event } from '@system/types/item/event-system';

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

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.ModifyAttribute,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ModifyAttribute}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ModifyAttribute}.Description`,
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
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ModifyAttribute}.Attribute.Label`,
                }),
                amount: new foundry.data.fields.NumberField({
                    required: true,
                    initial: 1,
                    integer: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ModifyAttribute}.Amount.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ModifyAttribute}.Amount.Hint`,
                }),
                bonus: new foundry.data.fields.BooleanField({
                    required: true,
                    initial: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ModifyAttribute}.Bonus.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.ModifyAttribute}.Bonus.Hint`,
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
            await actor.update(
                {
                    [`system.attributes.${this.attribute}`]: {
                        [this.bonus ? 'bonus' : 'value']:
                            actor.system.attributes[this.attribute][
                                this.bonus ? 'bonus' : 'value'
                            ] + this.amount,
                    },
                },
                event.op,
            );
        },
    });
}
