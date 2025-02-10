// Dialogs
import { PickDiceResultDialog } from '@system/applications/dialogs/pick-dice-result';

// Consants
const PICK_MODIFIER_REGEX = /(gm)?p(\d+)?/i;

(foundry.dice.terms.Die.MODIFIERS as unknown) = {
    ...foundry.dice.terms.Die.MODIFIERS,
    p: pick,
    gmp: pick,
};

async function pick(this: foundry.dice.terms.Die, modifier: string) {
    const rgx = new RegExp(PICK_MODIFIER_REGEX);
    const match = rgx.exec(modifier);
    if (!match) return false;

    const [gm, numStr] = match.slice(1);
    const isGm = !!gm; // NOTE: Unused at this time
    const amount = Math.min(parseInt(numStr) || 1, this.number ?? 0);

    // Show dialog
    await PickDiceResultDialog.show({
        term: this,
        amount,
    });
}
