import { Status } from '@system/types/cosmere';
import { ActiveEffectDataModel } from '@system/data/active-effect/active-effect';

import { AnyMutableObject } from '@system/types/utils';

// Utils
import { tryApplyRollData } from '@system/utils/changes';

export class CosmereActiveEffect extends ActiveEffect<ActiveEffectDataModel> {
    /* --- Accessors --- */

    /**
     * The number of stacked instances of this effect. Used for stackable effects.
     * Shorthand for `system.stacks`.
     */
    public get stacks() {
        return this.system.stacks ?? 1;
    }

    /**
     * Whether this effect is a system defined status effect.
     */
    public get isStatusEffect() {
        return (
            this.statuses.size === 1 &&
            this.id.startsWith(`cond${this.statuses.first()}`)
        );
    }

    /**
     * Whether this effect is a system defined condition.
     * This is an alias for `isStatusEffect`.
     */
    public get isCondition() {
        return this.isStatusEffect;
    }

    /**
     * Whether this effect is stackable.
     * Shorthand for `system.isStackable`.
     */
    public get isStackable() {
        return this.system.isStackable;
    }

    /* --- Lifecylce --- */

    public override async _preCreate(
        data: object,
        options: object,
        user: foundry.documents.BaseUser,
    ): Promise<boolean | void> {
        if ((await super._preCreate(data, options, user)) === false)
            return false;

        if (this.isCondition && this.isStackable && this.stacks >= 1) {
            const config =
                CONFIG.COSMERE.statuses[this.statuses.first() as Status];

            this.updateSource({
                name: `${game.i18n!.localize(config.label)} [${
                    config.stacksDisplayTransform
                        ? config.stacksDisplayTransform(this.stacks)
                        : this.stacks
                }]`,
            });
        }
    }

    public override async _preUpdate(
        data: AnyMutableObject,
        options: object,
        user: foundry.documents.BaseUser,
    ): Promise<boolean | void> {
        if (
            foundry.utils.hasProperty(data, 'system.stacks') &&
            this.isCondition &&
            this.isStackable
        ) {
            const stacks = foundry.utils.getProperty(
                data,
                'system.stacks',
            ) as number;
            const config =
                CONFIG.COSMERE.statuses[this.statuses.first() as Status];

            data.name = `${game.i18n!.localize(config.label)} [${
                config.stacksDisplayTransform
                    ? config.stacksDisplayTransform(stacks)
                    : stacks
            }]`;
        }

        return await super._preUpdate(data, options, user);
    }

    public override async _onUpdate(
        changed: object,
        options: object,
        userId: string,
    ) {
        await super._onUpdate(changed, options, userId);

        if (
            foundry.utils.hasProperty(changed, 'system.stacks') &&
            this.isCondition &&
            this.isStackable
        ) {
            this._displayScrollingStatus(this.active);
        }
    }

    public override apply(actor: Actor, change: ActiveEffect.EffectChangeData) {
        // Update the change
        const newChange = tryApplyRollData(actor, change);

        if (this.isStackable) {
            newChange.value = `( ${newChange.value} ) * ${this.stacks}`;
        }

        // Execute the standard ActiveEffect application logic
        return super.apply(actor, newChange);
    }
}
