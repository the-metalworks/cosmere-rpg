import { DeepPartial, AnyObject } from '@system/types/utils';

// Documents
import { CosmereItem, TalentTreeItem } from '@system/documents/item';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';

// ApplicationV2
const { ApplicationV2 } = foundry.applications.api;

// Components
import { TalentTreeViewComponent } from '@system/applications/item/components/talent-tree/talent-tree-view';

// Canvas
import { Viewport } from '@system/applications/canvas';

// Utils
import { getLinkDataStr } from '@system/utils/embed/item/generic';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';
import HandlebarsApplicationMixin from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/client-esm/applications/api/handlebars-application.mjs';

interface TalentTreeEmbedConfiguration
    extends DeepPartial<foundry.applications.api.ApplicationV2.Configuration> {
    item: TalentTreeItem;
    linkedItem?: CosmereItem;
    view?: Viewport.View;
}

interface TalentTreeEmbedRenderContext extends AnyObject {
    item: TalentTreeItem;
}

export class TalentTreeEmbed extends ComponentHandlebarsApplicationMixin(
    ApplicationV2,
)<TalentTreeEmbedRenderContext> {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            classes: [SYSTEM_ID, 'embed', 'talent-tree'],
            position: {
                width: 600,
                top: 0,
                left: 0,
            },
            window: {
                frame: false,
            },
            tag: 'div',
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            content: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_TALENT_TREE_EMBED}`,
            },
        },
    );

    #item: TalentTreeItem;

    public view?: Partial<Omit<Viewport.View, 'width' | 'height'>>;
    public linkedItem?: CosmereItem;

    public constructor(options: TalentTreeEmbedConfiguration) {
        // Get the aspect ratio of the talent tree
        const aspectRatio =
            options.item.system.viewBounds.width /
            options.item.system.viewBounds.height;

        // Get configured width
        const width = (options.position?.width ??
            TalentTreeEmbed.DEFAULT_OPTIONS.position!.width!) as number;

        // Calculate height based on aspect ratio
        const height = width / aspectRatio;

        super(
            foundry.utils.mergeObject(options, {
                position: {
                    height: height,
                },
            }),
        );
        this.#item = options.item;
        this.view = options.view;
        this.linkedItem = options.linkedItem;
    }

    /* --- Accessors --- */

    public get item(): TalentTreeItem {
        return this.#item;
    }

    /* --- Context --- */

    public async _prepareContext(
        options: DeepPartial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        return {
            ...(await super._prepareContext(options)),
            item: this.item,
            view: this.view,
            linkDataStr: getLinkDataStr(this.linkedItem ?? this.item, {
                tab: 'talents',
            }),
        };
    }
}
