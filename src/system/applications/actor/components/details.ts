import { ActorType } from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Dialogs
import { ConfigureMovementRateDialog } from '@system/applications/actor/dialogs/configure-movement-rate';
import { ConfigureSensesRangeDialog } from '@system/applications/actor/dialogs/configure-senses-range';
import { ConfigureRecoveryDieDialog } from '@system/applications/actor/dialogs/configure-recovery-die';
import { ConfigureDeflectDialog } from '@system/applications/actor/dialogs/configure-deflect';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';
import { CosmereActor } from '@src/system/documents';

export class ActorDetailsComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_DETAILS}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'short-rest': this.onShortRest,
        'long-rest': this.onLongRest,
        'configure-movement-rate': this.onConfigureMovementRate,
        'configure-senses-range': this.onConfigureSensesRange,
        'configure-recovery': this.onConfigureRecovery,
        'configure-deflect': this.onConfigureDeflect,
        'edit-img': this.onEditImg,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

    private static onShortRest(this: ActorDetailsComponent) {
        void this.application.actor.shortRest();
    }

    private static onLongRest(this: ActorDetailsComponent) {
        void this.application.actor.longRest();
    }

    private static onConfigureMovementRate(this: ActorDetailsComponent) {
        void ConfigureMovementRateDialog.show(this.application.actor);
    }

    private static onConfigureSensesRange(this: ActorDetailsComponent) {
        void ConfigureSensesRangeDialog.show(this.application.actor);
    }

    private static onConfigureDeflect(this: ActorDetailsComponent) {
        void ConfigureDeflectDialog.show(this.application.actor);
    }

    private static onConfigureRecovery(this: ActorDetailsComponent) {
        if (this.application.actor.isCharacter())
            void ConfigureRecoveryDieDialog.show(this.application.actor);
    }

    private static onEditImg(this: ActorDetailsComponent) {
        if (this.application.mode !== 'edit') return;

        const { img: defaultImg } = CosmereActor.getDefaultArtwork(
            this.application.actor.toObject(),
        );

        void new FilePicker({
            current: this.application.actor.img,
            type: 'image',
            redirectToRoot: [defaultImg],
            top: this.application.position.top + 40,
            left: this.application.position.left + 10,
            callback: (path) => {
                void this.application.actor.update({
                    img: path,
                });
            },
        }).browse();
    }

    /* --- Context --- */

    public _prepareContext(
        params: never,
        context: BaseActorSheetRenderContext,
    ) {
        const actor = this.application.actor;

        return Promise.resolve({
            ...context,
            type: actor.type,
            displayRestButtons: actor.type === ActorType.Character,
            displayRecovery: actor.type === ActorType.Character,
        });
    }
}

// Register
ActorDetailsComponent.register('app-actor-details');
