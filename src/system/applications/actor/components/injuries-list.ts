import { InjuryType, ItemType } from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';
import { CosmereItem } from '@system/documents';
import { InjuryItemDataModel } from '@system/data/item';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Utils
import AppUtils from '@system/applications/utils';
import { AppContextMenu } from '@system/applications/utils/context-menu';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseActorSheet, BaseActorSheetRenderContext } from '../base';

export class ActorInjuriesListComponent extends HandlebarsApplicationComponent<// typeof BaseActorSheet
// TODO: Resolve typing issues
// NOTE: Use any as workaround for foundry-vtt-types issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
any> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_INJURIES_LIST}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'reduce-injury-duration': this.onDecreaseInjuryDuration,
        'increase-injury-duration': this.onIncreaseInjuryDuration,
        'create-injury': this.onCreateInjury,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Actions --- */

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
            system: {
                duration: {
                    remaining: injuryItem.system.duration.remaining! - 1,
                },
            },
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
            system: {
                duration: {
                    remaining: injuryItem.system.duration.remaining! + 1,
                },
            },
        });
    }

    public static onRemoveInjury(
        this: ActorInjuriesListComponent,
        element: HTMLElement,
    ) {
        const injuryId = $(element)
            .closest('.item[data-item-id]')
            .data('item-id') as string | undefined;
        if (!injuryId) return;

        // Get the injury
        const injuryItem = this.application.actor.items.get(injuryId);
        if (!injuryItem?.isInjury()) return;

        // Delete the injury
        void injuryItem.delete();
    }

    public static onEditInjury(
        this: ActorInjuriesListComponent,
        element: HTMLElement,
    ) {
        const injuryId = $(element)
            .closest('.item[data-item-id]')
            .data('item-id') as string | undefined;
        if (!injuryId) return;

        // Get the injury
        const injuryItem = this.application.actor.items.get(injuryId);
        if (!injuryItem?.isInjury()) return;

        // Show item sheet
        void injuryItem.sheet?.render(true);
    }

    protected static async onCreateInjury(this: ActorInjuriesListComponent) {
        // Create new injury
        const item = (await Item.create(
            {
                type: ItemType.Injury,
                name: game.i18n.localize(
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

    /* --- Lifecycle --- */

    public _onInitialize(): void {
        if (this.application.isEditable) {
            // Create context menu
            AppContextMenu.create({
                parent: this,
                items: [
                    {
                        name: 'GENERIC.Button.Edit',
                        icon: 'fa-solid fa-pen-to-square',
                        callback:
                            ActorInjuriesListComponent.onEditInjury.bind(this),
                    },
                    {
                        name: 'GENERIC.Button.Remove',
                        icon: 'fa-solid fa-trash',
                        callback:
                            ActorInjuriesListComponent.onRemoveInjury.bind(
                                this,
                            ),
                    },
                ],
                selectors: ['a[data-action="toggle-controls"]'],
                anchor: 'right',
            });
        }
    }
}

// Register
ActorInjuriesListComponent.register('app-actor-injuries-list');
