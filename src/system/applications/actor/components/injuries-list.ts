import { InjuryType, ItemType } from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';
import { CosmereItem } from '@system/documents';
import { InjuryItemDataModel } from '@system/data/item';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

import AppUtils from '@system/applications/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';

export class ActorInjuriesListComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseActorSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_INJURIES_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'toggle-injury-controls': this.onToggleInjuryControls,
        'reduce-injury-duration': this.onDecreaseInjuryDuration,
        'increase-injury-duration': this.onIncreaseInjuryDuration,
        'edit-injury': this.onEditInjury,
        'remove-injury': this.onRemoveInjury,
        'create-injury': this.onCreateInjury,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private contextInjuryId: string | null = null;
    private controlsDropdownExpanded = false;

    /* --- Actions --- */

    public static onToggleInjuryControls(
        this: ActorInjuriesListComponent,
        event: PointerEvent,
    ) {
        // Get connection id
        const injuryId = $(event.currentTarget!)
            .closest('[data-item-id]')
            .data('item-id') as string;

        const target = event.currentTarget as HTMLElement;
        const root = $(target).closest('.tab-body');
        const dropdown = $(target)
            .closest('.item-list')
            .siblings('.controls-dropdown');

        const targetRect = target.getBoundingClientRect();
        const rootRect = root[0].getBoundingClientRect();

        if (this.contextInjuryId !== injuryId) {
            dropdown.css({
                top: `${Math.round(targetRect.top - rootRect.top)}px`,
                right: `${Math.round(rootRect.right - targetRect.right + targetRect.width)}px`,
            });

            if (!this.controlsDropdownExpanded) {
                dropdown.addClass('expanded');
                this.controlsDropdownExpanded = true;
            }

            this.contextInjuryId = injuryId;
        } else if (this.controlsDropdownExpanded) {
            dropdown.removeClass('expanded');
            this.controlsDropdownExpanded = false;
            this.contextInjuryId = null;
        }
    }

    public static onDecreaseInjuryDuration(
        this: ActorInjuriesListComponent,
        event: Event,
    ) {
        // Get injury item
        const injuryItem = AppUtils.getItemFromEvent(
            event,
            this.application.actor,
        );
        if (!injuryItem?.isInjury()) return;

        // Reduce duration by one
        void injuryItem.update({
            'system.duration.remaining':
                injuryItem.system.duration.remaining! - 1,
        });
    }

    public static onIncreaseInjuryDuration(
        this: ActorInjuriesListComponent,
        event: Event,
    ) {
        // Get injury item
        const injuryItem = AppUtils.getItemFromEvent(
            event,
            this.application.actor,
        );
        if (!injuryItem?.isInjury()) return;

        // Increase duration by one
        void injuryItem.update({
            'system.duration.remaining':
                injuryItem.system.duration.remaining! + 1,
        });
    }

    public static async onRemoveInjury(this: ActorInjuriesListComponent) {
        this.controlsDropdownExpanded = false;

        // Ensure context goal id is set
        if (this.contextInjuryId !== null) {
            // Remove the connection
            await this.application.actor.deleteEmbeddedDocuments(
                'Item',
                [this.contextInjuryId],
                { render: false },
            );

            this.contextInjuryId = null;
        }

        // Render
        await this.render();
    }

    public static onEditInjury(this: ActorInjuriesListComponent) {
        this.controlsDropdownExpanded = false;

        // Ensure context goal id is set
        if (this.contextInjuryId !== null) {
            // Get the injur
            const injury = this.application.actor.items.find(
                (i) => i.id === this.contextInjuryId,
            ) as CosmereItem<InjuryItemDataModel>;

            // Show injury sheet
            void injury.sheet?.render(true);

            this.contextInjuryId = null;
        }

        // Render
        void this.render();
    }

    protected static async onCreateInjury(this: ActorInjuriesListComponent) {
        this.controlsDropdownExpanded = false;

        // Create new injury
        const item = (await Item.create(
            {
                type: ItemType.Injury,
                name: game.i18n!.localize(
                    'COSMERE.Actor.Sheet.Injuries.NewInjury',
                ),
            },
            { parent: this.application.actor },
        )) as CosmereItem;

        // Show sheet
        void item.sheet?.render(true);
    }

    /* --- Context --- */

    public _prepareContext(
        params: unknown,
        context: BaseActorSheetRenderContext,
    ) {
        // Get list of injuries
        const injuries = this.application.actor.items.filter((item) =>
            item.isInjury(),
        );

        return Promise.resolve({
            ...context,

            injuries: injuries
                .map((item) => {
                    const type = item.system.type;

                    return {
                        ...item,
                        id: item.id,
                        type,
                        typeLabel: CONFIG.COSMERE.injury.types[type].label,
                        duration: item.system.duration,

                        isPermanent:
                            type === InjuryType.PermanentInjury ||
                            type === InjuryType.Death,
                    };
                })
                .sort((a, b) => {
                    const remainingA =
                        a.type === InjuryType.PermanentInjury
                            ? Number.MAX_SAFE_INTEGER
                            : (a.duration.remaining ?? 0);
                    const remainingB =
                        b.type === InjuryType.PermanentInjury
                            ? Number.MAX_SAFE_INTEGER
                            : (b.duration.remaining ?? 0);

                    return remainingB - remainingA;
                }),
        });
    }
}

// Register
ActorInjuriesListComponent.register('app-actor-injuries-list');
