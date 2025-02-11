import { AnyObject } from '@system/types/utils';

export class CosmereActiveEffect<
    D extends foundry.abstract.DataModel = foundry.abstract.DataModel,
> extends ActiveEffect<D> {
    public override apply(actor: Actor, change: ActiveEffect.EffectChangeData) {
        // Grab the roll data from the actor
        const data = actor.getRollData() as AnyObject;

        // Treat the change value as a formula and evaluate it
        const value = new Roll(change.value, data).evaluateSync().formula;

        // Update the change
        const newChange = {
            ...change,
            value: value,
        };

        // Execute the standard ActiveEffect application logic
        return super.apply(actor, newChange);
    }
}
