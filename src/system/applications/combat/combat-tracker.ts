import { ActorType, TurnSpeed } from '@system/types/cosmere';
import { DeepPartial } from '@system/types/utils';

// Documents
import { CosmereCombatant } from '@system/documents/combatant';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

export interface CosmereTurnContext extends CombatTracker.TurnContext {
    pending: number;
    finished: number;
    type?: Actor.SubType;
    turnSpeed?: TurnSpeed;
    activated?: boolean;
    isBoss?: boolean;
    bossFastActivated?: boolean;
}


interface CosmereTrackerContext extends CombatTracker.TrackerContext {
    turns: CosmereTurnContext[];
    fastPlayers: CosmereTurnContext[];
    slowPlayers: CosmereTurnContext[];
    fastNPC: CosmereTurnContext[];
    slowNPC: CosmereTurnContext[];
}

/**
 * Overrides default tracker template to implement slow/fast buckets and combatant activation button.
 */
export class CosmereCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {
    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            tracker: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.COMBAT_TRACKER}`
            }
        }
    );

    public override async _prepareTrackerContext(
        context: CombatTracker.RenderContext & CosmereTrackerContext,
        options: CombatTracker.RenderOptions,
    ) {
        super._prepareTrackerContext(context, options);

        // Add combatant type, speed, and activation status to existing turn data
        context.turns = context.turns.flatMap((turn, i) => {
            const combatant = this.viewed!.turns[i] as CosmereCombatant;

            // Prepare turn data
            const newTurn: CosmereTurnContext = {
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
        context.fastPlayers = context.turns.filter((turn) => {
            return (
                turn.type === ActorType.Character &&
                turn.turnSpeed === TurnSpeed.Fast
            );
        });
        context.slowPlayers = context.turns.filter((turn) => {
            return (
                turn.type === ActorType.Character &&
                turn.turnSpeed === TurnSpeed.Slow
            );
        });
        context.fastNPC = context.turns.filter((turn) => {
            return (
                turn.type === ActorType.Adversary &&
                turn.turnSpeed === TurnSpeed.Fast
            );
        });
        context.slowNPC = context.turns.filter((turn) => {
            return (
                turn.type === ActorType.Adversary &&
                turn.turnSpeed === TurnSpeed.Slow
            );
        });
    }

    override async _onFirstRender(
        context: DeepPartial<CombatTracker.RenderContext>,
        options: DeepPartial<CombatTracker.RenderOptions>,
    ) {
        await super._onFirstRender(context, options);

        const html = $(this.element);
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
        )! as CosmereCombatant;

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
    protected _onContextToggleTurnSpeed(el: HTMLElement) {
        const li = $(el);
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
    protected _onContextResetActivation(el: HTMLElement) {
        const li = $(el);
        // Get the combatant from the list item
        const combatant = this.viewed!.combatants.get(
            li.data('combatant-id') as string,
        ) as CosmereCombatant;

        // Reset the combatant's activation status
        void combatant.resetActivation();
    }

    protected override _getCombatContextOptions(): ContextMenu.Entry<HTMLElement>[] {
        const menu: ContextMenu.Entry<HTMLElement>[] = [
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
        
        // pushes existing context menu options, filtering out the initiative reroll and initiative clear options
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