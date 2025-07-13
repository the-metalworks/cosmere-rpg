import { DamageType, Resource, Status } from '@src/system/types/cosmere';
import { CosmereActor } from '@system/documents/actor';
import { DeepPartial, AnyObject } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';

// Utils
import AppUtils from '@system/applications/utils';

// Component System
import {
    ComponentHandlebarsApplicationMixin,
    ComponentHandlebarsRenderOptions,
} from '@system/applications/component-system';

// Mixins
import {
    TabsApplicationMixin,
    DragDropApplicationMixin,
    // ComponentHandlebarsApplicationMixin,
    // ComponentHandlebarsRenderOptions,
} from '@system/applications/mixins';

// Components
import { SortMode, SearchBarInputEvent } from './components';
import { renderSystemTemplate, TEMPLATES } from '@src/system/utils/templates';

const { ActorSheetV2 } = foundry.applications.sheets;

export type ActorSheetMode = 'view' | 'edit';

export const enum BaseSheetTab {
    Actions = 'actions',
    Equipment = 'equipment',
    Notes = 'notes',
    Effects = 'effects',
}

// NOTE: Have to use type instead of interface to comply with AnyObject type
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type BaseActorSheetRenderContext = {
    actor: CosmereActor;
    isEditMode: boolean;
};

export class BaseActorSheet<
    T extends BaseActorSheetRenderContext = BaseActorSheetRenderContext,
> extends TabsApplicationMixin(
    DragDropApplicationMixin(ComponentHandlebarsApplicationMixin(ActorSheetV2)),
)<T> {
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.mergeObject({}, super.DEFAULT_OPTIONS),
        {
            actions: {
                'toggle-mode': this.onToggleMode,
                'edit-html-field': this.editHtmlField,
                save: this.onSave,
            },
            form: {
                handler: this.onFormEvent,
                submitOnChange: true,
            } as unknown,
            dragDrop: [
                {
                    dragSelector: '[data-drag]',
                    dropSelector: '*',
                },
            ],
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    static PARTS = foundry.utils.mergeObject(super.PARTS, {
        navigation: {
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_BASE_NAVIGATION}`,
        },
    });

    static TABS = foundry.utils.mergeObject(super.TABS, {
        [BaseSheetTab.Actions]: {
            label: 'COSMERE.Actor.Sheet.Tabs.Actions',
            icon: '<i class="cosmere-icon">3</i>',
        },
        [BaseSheetTab.Equipment]: {
            label: 'COSMERE.Actor.Sheet.Tabs.Equipment',
            icon: '<i class="fa-solid fa-suitcase"></i>',
        },
        [BaseSheetTab.Notes]: {
            label: 'COSMERE.Actor.Sheet.Tabs.Notes',
            icon: '<i class="fa-solid fa-scroll"></i>',
        },
        [BaseSheetTab.Effects]: {
            label: 'COSMERE.Actor.Sheet.Tabs.Effects',
            icon: '<i class="fa-solid fa-bolt"></i>',
        },
    });

    protected updatingHtmlField = false;
    protected proseFieldName = '';
    protected proseFieldHtml = '';
    protected expanded = false;

    get isUpdatingHtmlField(): boolean {
        return this.updatingHtmlField;
    }

    get actor(): CosmereActor {
        return super.document;
    }

    protected actionsSearchText = '';
    protected actionsSearchSort: SortMode = SortMode.Alphabetic;

    protected equipmentSearchText = '';
    protected equipmentSearchSort: SortMode = SortMode.Alphabetic;

    protected effectsSearchText = '';
    protected effectsSearchSort: SortMode = SortMode.Alphabetic;

    /* --- Accessors --- */

    public get mode(): ActorSheetMode {
        return this.actor.getFlag(SYSTEM_ID, 'sheet.mode') ?? 'edit';
    }

    get areExpertisesCollapsed(): boolean {
        return (
            this.actor.getFlag(SYSTEM_ID, 'sheet.expertisesCollapsed') ?? false
        );
    }

    get areImmunitiesCollapsed(): boolean {
        return (
            this.actor.getFlag(SYSTEM_ID, 'sheet.immunitiesCollapsed') ?? false
        );
    }

    /* --- Drag drop --- */

    protected override _canDragStart(): boolean {
        return this.isEditable;
    }

    protected override _canDragDrop(): boolean {
        return this.isEditable;
    }

    protected override _onDragStart(event: DragEvent) {
        // Get dragged item
        const item = AppUtils.getItemFromEvent(event, this.actor);
        if (!item) return;

        const dragData = {
            type: 'Item',
            uuid: item.uuid,
        };

        // Set data transfer
        event.dataTransfer!.setData('text/plain', JSON.stringify(dragData));
        event.dataTransfer!.setData('document/item', ''); // Mark the type
    }

    protected override async _onDrop(event: DragEvent) {
        const data = TextEditor.getDragEventData(event) as unknown as {
            type: string;
            uuid: string;
        };

        // Ensure document type can be embedded on actor
        if (!(data.type in CosmereActor.metadata.embedded)) return;

        // Get the document
        const document = fromUuidSync(data.uuid);
        if (!document) return;

        if (!(document instanceof foundry.abstract.Document)) {
            const index = document as Record<string, string>;

            // Get the pack
            const pack = game.packs!.get(index.pack);
            if (!pack) return;

            // Get the document
            const packDocument = (await pack.getDocument(index._id))!;

            // Embed document
            void this.actor.createEmbeddedDocuments(data.type, [packDocument]);
        } else if (document.parent !== this.actor) {
            // Document not yet on this actor, create it
            void this.actor.createEmbeddedDocuments(data.type, [document]);
        }
    }

    /* --- Actions --- */

    public static async onToggleMode(this: BaseActorSheet, event: Event) {
        if (!(event.target instanceof HTMLInputElement)) return;

        // Stop event propagation
        event.preventDefault();
        event.stopPropagation();

        // Update the actor and re-render
        await this.actor.update(
            {
                'flags.cosmere-rpg.sheet.mode':
                    this.mode === 'view' ? 'edit' : 'view',
            },
            { render: true },
        );

        // Get toggle
        const toggle = $(this.element).find('#mode-toggle');

        // Update checked status
        toggle.find('input').prop('checked', this.mode === 'edit');

        // Update tooltip
        toggle.attr(
            'data-tooltip',
            game.i18n!.localize(
                `COSMERE.Actor.Sheet.${this.mode === 'edit' ? 'View' : 'Edit'}`,
            ),
        );
    }

    private static async editHtmlField(this: BaseActorSheet, event: Event) {
        event.stopPropagation();

        // Get html field element
        const fieldElement = $(event.target!).closest('[field-type]');

        // Get field type
        const proseFieldType = fieldElement.attr('field-type')!;

        // Gets the field to display based on the type found
        if (proseFieldType === 'biography') {
            this.proseFieldHtml = this.actor.system.biography ?? '';
        } else if (proseFieldType === 'appearance') {
            this.proseFieldHtml = this.actor.system.appearance ?? '';
        } else if (proseFieldType === 'notes') {
            this.proseFieldHtml = this.actor.system.notes ?? '';
        }

        // Gets name for use in prose mirror
        this.proseFieldName = 'system.' + proseFieldType;

        // Switches to prose mirror
        this.updatingHtmlField = true;

        await this.render(true);
    }

    /**
     * Provide a static callback for the prose mirror save button
     */
    private static async onSave(this: BaseActorSheet) {
        await this.saveHtmlField();
    }

    /* --- Form --- */

    public static async onFormEvent(
        this: BaseActorSheet,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        // Handle notes fields separately
        if ((event.target as HTMLElement).className.includes('prosemirror')) {
            await this.saveHtmlField();
            void this.actor.update(formData.object);
            return;
        }

        if (
            !(event.target instanceof HTMLInputElement) &&
            !(event.target instanceof HTMLTextAreaElement) &&
            !(event.target instanceof HTMLSelectElement)
        )
            return;
        if (!event.target.name) return;

        Object.keys(this.actor.system.resources).forEach((resourceId) => {
            let resourceValue = formData.object[
                `system.resources.${resourceId}.value`
            ] as string;

            // Clean the value
            resourceValue = resourceValue
                .replace(/[^-+\d]/g, '')
                .replace(/((?<=\d+)\b.*)|((\+|-)*(?=(\+|-)\d))/g, '');

            // Get the number value
            let numValue = Number(resourceValue.replace(/\+|-/, ''));
            numValue = isNaN(numValue) ? 0 : numValue;

            if (resourceValue.includes('-'))
                numValue =
                    this.actor.system.resources[resourceId as Resource].value -
                    numValue;
            else if (resourceValue.includes('+'))
                numValue =
                    this.actor.system.resources[resourceId as Resource].value +
                    numValue;

            formData.object[`system.resources.${resourceId}.value`] = numValue;
        });

        // Update document
        void this.actor.update(formData.object, { diff: false });
    }

    protected async _renderFrame(
        options: Partial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ): Promise<HTMLElement> {
        const frame = await super._renderFrame(options);

        const corners = await renderSystemTemplate(
            TEMPLATES.GENERAL_SHEET_CORNERS,
            {},
        );
        $(frame).prepend(corners);

        const banners = await renderSystemTemplate(
            TEMPLATES.GENERAL_SHEET_BACKGROUND,
            {},
        );
        $(frame).prepend(banners);

        // Insert mode toggle
        if (this.isEditable) {
            $(this.window.title!).before(`
                <label id="mode-toggle" 
                    class="toggle-switch"
                    data-action="toggle-mode"
                    data-tooltip="COSMERE.Actor.Sheet.Edit"
                >
                    <input type="checkbox" ${this.mode === 'edit' ? 'checked' : ''}>
                    <div class="slider rounded">
                        <i class="fa-solid fa-pen"></i>
                    </div>
                </label>
            `);
        }

        return frame;
    }

    /* --- Lifecycle --- */

    protected _onRender(
        context: AnyObject,
        options: ComponentHandlebarsRenderOptions,
    ) {
        super._onRender(context, options);

        if (options.parts.includes('content')) {
            this.element
                .querySelector('#actions-search')!
                .addEventListener(
                    'search',
                    this.onActionsSearchChange.bind(this) as EventListener,
                );

            this.element
                .querySelector('#equipment-search')
                ?.addEventListener(
                    'search',
                    this.onEquipmentSearchChange.bind(this) as EventListener,
                );

            this.element
                .querySelector('#effects-search')
                ?.addEventListener(
                    'search',
                    this.onEffectsSearchChange.bind(this) as EventListener,
                );

            this.element
                .querySelector('app-actor-equipment-list')
                ?.addEventListener(
                    'currency',
                    this.onCurrencyChange.bind(this) as EventListener,
                );
        }

        $(this.element)
            .find('#mode-toggle')
            .on('dblclick', (event) => this.onDoubleClickModeToggle(event));

        $(this.element)
            .find('.collapsible .header')
            .on('click', (event) => this.onClickCollapsible(event));
    }

    /* --- Event handlers --- */

    protected onClickCollapsible(event: JQuery.ClickEvent) {
        const target = event.currentTarget as HTMLElement;
        target?.parentElement?.classList.toggle('expanded');
    }

    protected onDoubleClickModeToggle(event: JQuery.DoubleClickEvent) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    protected onActionsSearchChange(event: SearchBarInputEvent) {
        this.actionsSearchText = event.detail.text;
        this.actionsSearchSort = event.detail.sort;

        void this.render({
            parts: [],
            components: ['app-actor-actions-list'],
        });
    }

    protected onEquipmentSearchChange(event: SearchBarInputEvent) {
        this.equipmentSearchText = event.detail.text;
        this.equipmentSearchSort = event.detail.sort;

        void this.render({
            parts: [],
            components: ['app-actor-equipment-list'],
        });
    }

    protected onEffectsSearchChange(event: SearchBarInputEvent) {
        this.effectsSearchText = event.detail.text;
        this.effectsSearchSort = event.detail.sort;

        void this.render({
            parts: [],
            components: ['app-actor-effects-list'],
        });
    }

    protected onCurrencyChange(event: CustomEvent) {
        void this.render({
            parts: [],
            components: ['app-actor-currency-list'],
        });
    }

    /* --- Context --- */

    public async _prepareContext(
        options: DeepPartial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        // Get enriched versions of HTML fields
        let enrichedBiographyValue = undefined;
        let enrichedAppearanceValue = undefined;
        let enrichedNotesValue = undefined;
        if (this.actor.system.biography) {
            enrichedBiographyValue = await TextEditor.enrichHTML(
                this.actor.system.biography,
                { relativeTo: this.document as foundry.abstract.Document.Any },
            );
        }
        if (this.actor.system.appearance) {
            enrichedAppearanceValue = await TextEditor.enrichHTML(
                this.actor.system.appearance,
                { relativeTo: this.document as foundry.abstract.Document.Any },
            );
        }
        if (this.actor.system.notes) {
            enrichedNotesValue = await TextEditor.enrichHTML(
                this.actor.system.notes,
                { relativeTo: this.document as foundry.abstract.Document.Any },
            );
        }

        // separating this as most times one or both can be shortcutted
        const hasDamageImmunities = (
            Object.keys(this.actor.system.immunities.damage) as DamageType[]
        ).some((type) => this.actor.system.immunities.damage[type]);
        const hasConditionImmunities = (
            Object.keys(this.actor.system.immunities.condition) as Status[]
        ).some((cond) => this.actor.system.immunities.condition[cond]);
        const hasImmunities = hasDamageImmunities || hasConditionImmunities;

        return {
            ...(await super._prepareContext(options)),
            actor: this.actor,

            editable: this.isEditable,
            mode: this.mode,
            expertisesCollapsed: this.areExpertisesCollapsed,
            hasExpertises:
                this.actor.system.expertises &&
                this.actor.system.expertises.size > 0,
            immunitiesCollapsed: this.areImmunitiesCollapsed,
            hasImmunities,
            isEditMode: this.mode === 'edit' && this.isEditable,

            // Prose mirror state
            isUpdatingHtmlField: this.isUpdatingHtmlField,
            biographyHtml: enrichedBiographyValue,
            appearanceHtml: enrichedAppearanceValue,
            notesHtml: enrichedNotesValue,
            proseFieldName: this.proseFieldName,
            proseFieldHtml: this.proseFieldHtml,

            resources: Object.keys(this.actor.system.resources),
            attributeGroups: Object.keys(CONFIG.COSMERE.attributeGroups),

            // Search
            actionsSearch: {
                text: this.actionsSearchText,
                sort: this.actionsSearchSort,
            },
            equipmentSearch: {
                text: this.equipmentSearchText,
                sort: this.equipmentSearchSort,
            },
            effectsSearch: {
                text: this.effectsSearchText,
                sort: this.effectsSearchSort,
            },
        };
    }

    /* --- Helpers --- */

    /**
     * Helper to update the prose mirror edit state
     */
    private async saveHtmlField() {
        console.log('Saving HTML Field');
        // Switches back from prose mirror
        this.updatingHtmlField = false;
        await this.render(true);
    }
}
