import { TalentTree } from '@system/types/item';
import { CosmereItem, GoalItem } from '@system/documents/item';
import { ConstructorOf } from '@system/types/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { EditNodePrerequisiteDialog } from '../../dialogs/talent-tree/edit-node-prerequisite';

// Mixins
import { DragDropComponentMixin } from '@system/applications/mixins/drag-drop';

// NOTE: Must use type here instead of interface as an interface doesn't match AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type Params = {
    node: TalentTree.TalentNode;
    goals: Collection<TalentTree.Node.Prerequisite.GoalRef>;
};

export class NodePrerequisiteGoalListComponent extends DragDropComponentMixin(
    HandlebarsApplicationComponent<
        ConstructorOf<EditNodePrerequisiteDialog>,
        Params
    >,
) {
    static readonly TEMPLATE =
        'systems/cosmere-rpg/templates/item/talent-tree/components/prerequisite-goal-list.hbs';

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'remove-goal': this.onRemoveGoal,
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

    public get goals() {
        return this.params!.goals;
    }

    /* --- Actions --- */

    private static onRemoveGoal(
        this: NodePrerequisiteGoalListComponent,
        event: Event,
    ) {
        // Get goal element
        const el = $(event.currentTarget!).closest('.goal');

        // Get id
        const id = el.data('id') as string;

        // Remove goal
        this.goals.delete(id);

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
        const data = TextEditor.getDragEventData(event) as unknown as {
            type: string;
            uuid: string;
        };
        if (data.type !== 'Item') return;

        // Get document
        const item = (await fromUuid(data.uuid))! as unknown as CosmereItem;

        // Check if document is a goal
        if (!item.isGoal()) return;

        // Check if a goal with the same ID is already in the list
        const duplicateRef = this.goals.find(
            (ref) => ref.id === item.system.id,
        );
        if (duplicateRef) {
            // Retrieve duplicate goal
            const duplicate = (await fromUuid(
                duplicateRef.uuid,
            ))! as unknown as GoalItem;

            // Show a warning
            return ui.notifications.warn(
                game.i18n!.format(
                    'GENERIC.Warning.DuplicatePrerequisiteGoalRef',
                    {
                        goalId: duplicate.system.id,
                        goalName: duplicate.name,
                    },
                ),
            );
        }

        // Add goal to the list
        this.goals.set(item.system.id, {
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
        const contentLinks = this.goals.map(
            (ref) => `@UUID[${ref.uuid}]{${ref.label}}`,
        );

        // Enrich links
        const enrichedLinks = await Promise.all(
            contentLinks.map((link) => TextEditor.enrichHTML(link)),
        );

        return {
            ...params,
            goals: this.goals.map(({ id }, index) => ({
                id,
                link: enrichedLinks[index],
            })),
        };
    }
}

// Register the component
NodePrerequisiteGoalListComponent.register('app-node-prerequisite-goal-list');
