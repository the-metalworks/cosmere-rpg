import { TalentTree } from '@system/types/item';
import { CosmereItem, TalentItem } from '@system/documents/item';
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
    talents: Collection<TalentTree.Node.Prerequisite.TalentRef>;
};

export class NodePrerequisiteTalentListComponent extends DragDropComponentMixin(
    HandlebarsApplicationComponent<
        ConstructorOf<EditNodePrerequisiteDialog>,
        Params
    >,
) {
    static readonly TEMPLATE =
        'systems/cosmere-rpg/templates/item/talent-tree/components/prerequisite-talent-list.hbs';

    /**
     * NOTE: Unbound methods is the standard for defining actions
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'remove-talent': this.onRemoveTalent,
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

    public get talents() {
        return this.params!.talents;
    }

    /* --- Actions --- */

    private static onRemoveTalent(
        this: NodePrerequisiteTalentListComponent,
        event: Event,
    ) {
        // Get talent element
        const el = $(event.currentTarget!).closest('.talent');

        // Get id
        const id = el.data('id') as string;

        // Remove talent
        this.talents.delete(id);

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

        // Check if document is a talent
        if (!item.isTalent()) return;

        // Check if the talent is the same as the root talent
        if (item.system.id === this.node.talentId) {
            return ui.notifications.warn(
                game.i18n!.localize(
                    'GENERIC.Warning.TalentCannotBePrerequisiteOfItself',
                ),
            );
        }

        // Check if a talent with the same ID is already in the list
        const duplicateRef = this.talents.find(
            (ref) => ref.id === item.system.id,
        );
        if (duplicateRef) {
            // Retrieve duplicate talent
            const duplicate = (await fromUuid(
                duplicateRef.uuid,
            ))! as unknown as TalentItem;

            // Show a warning
            return ui.notifications.warn(
                game.i18n!.format(
                    'GENERIC.Warning.DuplicatePrerequisiteTalentRef',
                    {
                        talentId: duplicate.system.id,
                        talentName: duplicate.name,
                    },
                ),
            );
        }

        // Add talent to the list
        this.talents.set(item.system.id, {
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
        const contentLinks = this.talents.map(
            (ref) => `@UUID[${ref.uuid}]{${ref.label}}`,
        );

        // Enrich links
        const enrichedLinks = await Promise.all(
            contentLinks.map((link) => TextEditor.enrichHTML(link)),
        );

        return {
            ...params,
            talents: this.talents.map(({ id }, index) => ({
                id,
                link: enrichedLinks[index],
            })),
        };
    }
}

// Register the component
NodePrerequisiteTalentListComponent.register(
    'app-node-prerequisite-talent-list',
);
