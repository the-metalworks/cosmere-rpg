import { Condition } from '@system/types/cosmere';
import { ConstructorOf, MouseButton } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheetRenderContext } from '../base';
import { BaseActorSheet } from '../base';

export class ActorConditionsComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_CONDITIONS}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'cycle-condition': {
            handler: this.onCycleCondition,
            buttons: [MouseButton.Primary, MouseButton.Secondary],
        },
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    public static async onCycleCondition(
        this: ActorConditionsComponent,
        event: Event,
    ) {
        // Get condition
        const condition = $(event.target!)
            .closest('[data-id]')
            .data('id') as Condition;

        // Whether the condition is active
        const active = this.application.actor.conditions.has(condition);

        // Get the config
        const config = CONFIG.COSMERE.statuses[condition];

        if (config.stackable && active) {
            const cycleUp = event.type === 'click';

            // Get the condition effect
            const effect = this.application.actor.appliedEffects.find(
                (effect) =>
                    effect.isCondition && effect.statuses.has(condition),
            )!;

            // Calculate the new stacks
            const newStacks = cycleUp ? effect.stacks + 1 : effect.stacks - 1;

            if (newStacks > 0) {
                // Update the effect
                await effect.update({
                    'system.stacks': newStacks,
                });
            } else {
                await this.application.actor.toggleStatusEffect(condition);
            }
        } else if (event.type === 'click') {
            // Toggle the status effect for the condition
            await this.application.actor.toggleStatusEffect(condition);
        }
    }

    /* --- Context --- */

    public _prepareContext(
        params: object,
        context: BaseActorSheetRenderContext,
    ) {
        return Promise.resolve({
            ...context,

            conditions: (Object.keys(CONFIG.COSMERE.statuses) as Condition[])
                .filter((id) => CONFIG.COSMERE.statuses[id].condition)
                .map((id) => {
                    // Get the config
                    const config = CONFIG.COSMERE.statuses[id];

                    const active = this.application.actor.conditions.has(id);

                    const baseContext = {
                        id,
                        name: config.label,
                        icon: config.icon,
                        active,
                        stackable: config.stackable,
                        immune: this.application.actor.system.immunities
                            .condition[id],
                    };

                    if (!active || !config.stackable) return baseContext;
                    else {
                        // Get all effects that apply the condition
                        const effects =
                            this.application.actor.appliedEffects.filter(
                                (effect) => effect.statuses.has(id),
                            );

                        // Calculate the total count
                        const count = effects.reduce(
                            (total, effect) => total + effect.stacks,
                            0,
                        );

                        return {
                            ...baseContext,
                            stacks: config.stacksDisplayTransform
                                ? config.stacksDisplayTransform(count)
                                : count,
                        };
                    }
                }),
        });
    }
}

// Register
ActorConditionsComponent.register('app-actor-conditions');
