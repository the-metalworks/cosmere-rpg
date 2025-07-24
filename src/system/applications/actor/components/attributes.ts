import { AttributeGroup, Attribute } from '@system/types/cosmere';
import { AnyObject, ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Dialogs
import { ConfigureDefenseDialog } from '@system/applications/actor/dialogs/configure-defense';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';

export class ActorAttributesComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_ATTRIBUTES}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.ACTIONS),
        {
            'configure-defense': this.onConfigureDefense,
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    private static onConfigureDefense(
        this: ActorAttributesComponent,
        event: Event,
    ) {
        // Get the group id
        const groupId = $(event.target!)
            .closest('[data-id]')
            .data('id') as AttributeGroup;

        void ConfigureDefenseDialog.show(this.application.actor, groupId);
    }

    /* --- Lifecycle --- */

    protected _onAttachListeners(params: AnyObject): void {
        super._onAttachListeners(params);

        $(this.element!)
            .find('.attribute input:not([readonly])')
            .on('focus', (event) => {
                // Get the source value
                const sourceValue = $(event.target).data(
                    'source-value',
                ) as number;

                // Set the value to the source value
                $(event.target).val(sourceValue);

                // Select the input
                $(event.target).trigger('select');
            })
            .on('blur', (event) => {
                // Get the total
                const total = $(event.target).data('total') as number;

                // Set the value to the total
                $(event.target).val(total);
            });
    }

    /* --- Context --- */

    public _prepareContext(
        params: object,
        context: BaseActorSheetRenderContext,
    ) {
        return Promise.resolve({
            ...context,

            attributeGroups: (
                Object.keys(CONFIG.COSMERE.attributeGroups) as AttributeGroup[]
            ).map(this.prepareAttributeGroup.bind(this)),
        });
    }

    private prepareAttributeGroup(groupId: AttributeGroup) {
        // Get the attribute group config
        const groupConfig = CONFIG.COSMERE.attributeGroups[groupId];

        return {
            id: groupId,
            config: groupConfig,
            defense: this.application.actor.system.defenses[groupId],
            attributes: groupConfig.attributes.map(
                this.prepareAttribute.bind(this),
            ),
        };
    }

    private prepareAttribute(attrId: Attribute) {
        // Get the attribute config
        const attrConfig = CONFIG.COSMERE.attributes[attrId];

        const attr = this.application.actor.system.attributes[attrId];
        const source = (
            this.application.actor._source as {
                system: {
                    attributes: Record<
                        Attribute,
                        { value: number; bonus: number }
                    >;
                };
            }
        ).system.attributes[attrId];

        const total = attr.value + attr.bonus;
        const sourceTotal = source.value + source.bonus;

        return {
            id: attrId,
            config: attrConfig,
            ...attr,
            total,
            source: source,
            modified: total !== sourceTotal,
        };
    }
}

// Register
ActorAttributesComponent.register('app-actor-attributes');
