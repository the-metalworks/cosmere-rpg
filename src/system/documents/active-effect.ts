import { AnyObject } from '@system/types/utils';

export class CosmereActiveEffect<
    D extends foundry.abstract.DataModel = foundry.abstract.DataModel,
> extends ActiveEffect<D> {
    public override apply(actor: Actor, change: ActiveEffect.EffectChangeData) {
        // Update the change
        const newChange = {
            ...change,
            value: tryApplyRollData(actor, change.value),
        };

        // Execute the standard ActiveEffect application logic
        return super.apply(actor, newChange);
    }
}

function tryApplyRollData(actor: Actor, value: string): string {
    try {
        // Grab the roll data from the actor
        const data = actor.getRollData() as AnyObject;

        // Treat the change value as a formula and evaluate it
        value = new Roll(value, data).evaluateSync().formula;
        return value;
    } catch {
        return value;
    }
}
