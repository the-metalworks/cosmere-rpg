import { TalentTree } from '@system/types/item';
import {
    AncestryItem,
    CosmereItem,
    CultureItem,
    GoalItem,
    PowerItem,
    TalentItem,
} from '@system/documents/item';
import { ConstructorOf } from '@system/types/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { EditNodePrerequisiteDialog } from '../../dialogs/talent-tree/edit-node-prerequisite';

// Mixins
import { DragDropComponentMixin } from '@system/applications/mixins/drag-drop';
import { Node } from '@src/system/types/item/talent-tree';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    node: TalentTree.TalentNode;
    items: Collection<TalentTree.Node.Prerequisite.ItemRef>;
    type: TalentTree.Node.Prerequisite.Type;
};

export class NodePrerequisiteItemListComponent extends DragDropComponentMixin(
    HandlebarsApplicationComponent<
        // typeof EditNodePrerequisiteDialog,
        // TODO: Resolve typing issues
        // NOTE: Use any as workaround for foundry-vtt-types issues
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
        Params
    >,
) {
    static readonly TEMPLATE =
        'systems/cosmere-rpg/templates/item/talent-tree/components/prerequisite-item-list.hbs';

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'remove-item': this.onRemoveItem,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    static DRAG_DROP = [
        {
            dropSelector: '*',
        },
    ];

    /* --- Accessors --- */

    public get node() {
        return this.params!.node;
    }

    public get items() {
        return this.params!.items;
    }

    /* --- Actions --- */

    private static onRemoveItem(
        this: NodePrerequisiteItemListComponent,
        event: Event,
    ) {
        // Get talent element
        const el = $(event.currentTarget!).closest('.talent');

        // Get id
        const id = el.data('id') as string;

        // Remove item
        this.items.delete(id);

        // Dispatch change event
        this.element!.dispatchEvent(new Event('change'));

        // Re-render
        void this.render();
    }

    /* --- Drag drop --- */

    protected override _canDragDrop() {
        return true;
    }

    protected override async _onDrop(event: DragEvent) {
        const data =
            foundry.applications.ux.TextEditor.implementation.getDragEventData(
                event,
            ) as unknown as {
                type: string;
                uuid: string;
            };
        if (data.type !== 'Item') return;

        // Get document
        const item = (await fromUuid(data.uuid))! as unknown as
            | AncestryItem
            | CultureItem
            | GoalItem
            | PowerItem
            | TalentItem;

        // Check if document is the correct type for the prerequisite rule
        switch (this.params?.type) {
            case Node.Prerequisite.Type.Ancestry:
                if (!item.isAncestry()) return;
                break;
            case Node.Prerequisite.Type.Culture:
                if (!item.isCulture()) return;
                break;
            case Node.Prerequisite.Type.Goal:
                if (!item.isGoal()) return;
                break;
            case Node.Prerequisite.Type.Power:
                if (!item.isPower()) return;
                break;
            case Node.Prerequisite.Type.Talent:
                if (!item.isTalent()) return;

                // Check if the talent is the same as the root talent
                if (item.system.id === this.node.talentId) {
                    return ui.notifications.warn(
                        game.i18n.localize(
                            'GENERIC.Warning.TalentCannotBePrerequisiteOfItself',
                        ),
                    );
                }

                break;
        }

        // Check if an item with the same ID is already in the list
        const duplicateRef = this.items.find(
            (ref) => ref.id === item.system.id,
        );
        if (duplicateRef) {
            // Retrieve duplicate talent
            const duplicate = (await fromUuid(
                duplicateRef.uuid,
            ))! as unknown as TalentItem;

            // Show a warning
            return ui.notifications.warn(
                game.i18n.format(
                    'GENERIC.Warning.DuplicatePrerequisiteTalentRef',
                    {
                        talentId: duplicate.system.id,
                        talentName: duplicate.name,
                    },
                ),
            );
        }

        // Add talent to the list
        this.items.set(item.system.id, {
            id: item.system.id,
            uuid: item.uuid,
            label: item.name,
        });

        // Dispatch change event
        this.element!.dispatchEvent(new Event('change'));

        // Re-render
        void this.render();
    }

    /* --- Context --- */

    public async _prepareContext(params: Params, context: never) {
        // Construct content links
        const contentLinks = this.items.map(
            (ref) => `@UUID[${ref.uuid}]{${ref.label}}`,
        );

        // Enrich links
        const enrichedLinks = await Promise.all(
            contentLinks.map((link) =>
                foundry.applications.ux.TextEditor.implementation.implementation.enrichHTML(
                    link,
                ),
            ),
        );

        return {
            ...params,
            items: this.items.map(({ id }, index) => ({
                id,
                link: enrichedLinks[index],
            })),
        };
    }
}

// Register the component
NodePrerequisiteItemListComponent.register('app-node-prerequisite-item-list');
