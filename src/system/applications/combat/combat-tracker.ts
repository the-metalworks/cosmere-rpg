import { ActorType, TurnSpeed } from '@system/types/cosmere';

// Documents
import { CosmereCombatant } from '@system/documents/combatant';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

/**
 * Overrides default tracker template to implement slow/fast buckets and combatant activation button.
 */
export class CosmereCombatTracker extends CombatTracker {
    override get template() {
        return `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMBAT_TRACKER}`;
    }

    /**
     *  modifies data being sent to the combat tracker template to add turn speed, type and activation status and splitting turns between the initiative phases.
     */
    override async getData(
        options?: Partial<ApplicationOptions> | undefined,
    ): Promise<object> {
        const data = (await super.getData(options)) as {
            turns: CosmereTurn[];
            fastPlayers: CosmereTurn[];
            slowPlayers: CosmereTurn[];
            fastNPC: CosmereTurn[];
            slowNPC: CosmereTurn[];
        };

        // Add combatant type, speed, and activation status to existing turn data
        data.turns = data.turns.flatMap((turn, i) => {
            const combatant = this.viewed!.turns[i] as CosmereCombatant;

            // Prepare turn data
            const newTurn: CosmereTurn = {
                ...turn,
                turnSpeed: combatant.turnSpeed,
                type: combatant.actor.type,
                activated: combatant.activated,
                isBoss: combatant.isBoss,
                bossFastActivated: combatant.bossFastActivated,
            };

            // Strip active player formatting
            newTurn.css = '';

            // provide current turn for non-boss combatants
            return newTurn;
        });

        //split turn data into individual turn "buckets" to separate them in the combat tracker ui
        data.fastPlayers = data.turns.filter((turn) => {
            return (
                turn.type === ActorType.Character &&
                turn.turnSpeed === TurnSpeed.Fast
            );
        });
        data.slowPlayers = data.turns.filter((turn) => {
            return (
                turn.type === ActorType.Character &&
                turn.turnSpeed === TurnSpeed.Slow
            );
        });
        data.fastNPC = data.turns.filter((turn) => {
            return (
                turn.type === ActorType.Adversary &&
                turn.turnSpeed === TurnSpeed.Fast
            );
        });
        data.slowNPC = data.turns.filter((turn) => {
            return (
                turn.type === ActorType.Adversary &&
                turn.turnSpeed === TurnSpeed.Slow
            );
        });

        return data;
    }

    /**
     * add listeners to toggleTurnSpeed and activation buttons
     */
    override activateListeners(html: JQuery<HTMLElement>): void {
        super.activateListeners(html);
        html.find(`[data-control='toggleSpeed']`).on(
            'click',
            this._onClickToggleTurnSpeed.bind(this),
        );
        html.find(`[data-control='activateCombatant']`).on(
            'click',
            this._onActivateCombatant.bind(this),
        );
    }

    /**
     * toggles combatant turn speed on clicking the "fast/slow" button on the combat tracker window
     * */
    protected _onClickToggleTurnSpeed(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        // Get the button and the closest combatant list item
        const btn = event.currentTarget as HTMLElement;
        const li = btn.closest<HTMLElement>('.combatant')!;

        // Get the combatant
        const combatant = this.viewed!.combatants.get(
            li.dataset.combatantId!,
        ) as CosmereCombatant;

        // Toggle the combatant's turn speed
        void combatant.toggleTurnSpeed();
    }

    /**
     *  activates the combatant when clicking the activation button
     */
    protected _onActivateCombatant(event: Event) {
        event.preventDefault();
        event.stopPropagation();

        // Get the button and the closest combatant list item
        const btn = event.currentTarget as HTMLElement;
        const li = btn.closest<HTMLElement>('.combatant')!;

        // Get the combatant
        const combatant = this.viewed!.combatants.get(
            li.dataset.combatantId!,
        ) as CosmereCombatant;

        // Mark the combatant as activated
        void combatant.markActivated(
            combatant.isBoss && li.dataset.phase === TurnSpeed.Fast,
        );
    }

    /**
     * toggles combatant turn speed on clicking the "fast/slow" option in the turn tracker context menu
     */
    protected _onContextToggleTurnSpeed(li: JQuery<HTMLElement>) {
        // Get the combatant from the list item
        const combatant = this.viewed!.combatants.get(
            li.data('combatant-id') as string,
        ) as CosmereCombatant;

        // Toggle the combatant's turn speed
        void combatant.toggleTurnSpeed();
    }

    /**
     * resets combatants activation status to hasn't activated
     */
    protected _onContextResetActivation(li: JQuery<HTMLElement>) {
        // Get the combatant from the list item
        const combatant = this.viewed!.combatants.get(
            li.data('combatant-id') as string,
        ) as CosmereCombatant;

        // Reset the combatant's activation status
        void combatant.resetActivation();
    }

    /**
     * Overwrites combatants context menu options, adding toggle turn speed and reset activation options. Removes initiative rolling options from base implementation.
     */
    _getEntryContextOptions(): ContextMenuEntry[] {
        const menu: ContextMenuEntry[] = [
            {
                name: 'COSMERE.Combat.ToggleTurn',
                icon: '',
                callback: this._onContextToggleTurnSpeed.bind(this),
            },
            {
                name: 'COSMERE.Combat.ResetActivation',
                icon: '<i class="fas fa-undo"></i>',
                callback: this._onContextResetActivation.bind(this),
            },
        ];
        //pushes existing context menu options, filtering out the initiative reroll and initiative clear options
        menu.push(
            ...super
                ._getEntryContextOptions()
                .filter(
                    (i) =>
                        i.name !== 'COMBAT.CombatantReroll' &&
                        i.name !== 'COMBAT.CombatantClear',
                ),
        );
        return menu;
    }
}

export interface CosmereTurn {
    id: string;
    css: string;
    pending: number;
    finished: number;
    type?: ActorType;
    turnSpeed?: TurnSpeed;
    activated?: boolean;
    isBoss?: boolean;
    bossFastActivated?: boolean;
}
