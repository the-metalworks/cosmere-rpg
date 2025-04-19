import { PathItem, TalentTreeItem } from '@system/documents/item';
import { CharacterActor } from '@system/documents/actor';
import { DeepPartial } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Components
import { TalentTreeViewComponent } from './components/talent-tree/talent-tree-view';

// Base
import { BaseItemSheet } from './base';

export class PathItemSheet extends BaseItemSheet {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            classes: [SYSTEM_ID, 'sheet', 'item', 'path'],
            position: {
                width: 550,
            },
            window: {
                resizable: false,
                positioned: true,
            },
        },
    );

    static TABS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.TABS),
        {
            talents: {
                label: 'COSMERE.Item.Sheet.Tabs.Talents',
                icon: '<i class="fa-solid fa-sword"></i>',
                sortIndex: 14,
            },
            details: {
                label: 'COSMERE.Item.Sheet.Tabs.Details',
                icon: '<i class="fa-solid fa-circle-info"></i>',
                sortIndex: 15,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            content: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_PATH_CONTENT}`,
            },
        },
    );

    get item(): PathItem {
        return super.document;
    }

    private get talentTreeViewComponent() {
        return Object.values(this.components).find(
            (component) => component instanceof TalentTreeViewComponent,
        )!;
    }

    /* --- Lifecycle --- */

    protected _onFirstRender(context: unknown, options: unknown): void {
        super._onFirstRender(context, options);

        // Invoke on tab change
        void this.onTabChange();
    }

    protected override async onTabChange() {
        if (this.tab === 'talents') {
            // Look up talent tree
            const talentTree = this.item.system.talentTree
                ? ((await fromUuid(this.item.system.talentTree)) as unknown as
                      | TalentTreeItem
                      | undefined)
                : undefined;
            if (!talentTree) return;

            // Set position
            this.setPosition({
                width: talentTree.system.display.width
                    ? talentTree.system.display.width + 41
                    : this.position.width,
                height: talentTree.system.display.height
                    ? talentTree.system.display.height + 170
                    : 'auto',
            });

            setTimeout(() => {
                this.talentTreeViewComponent.element!.style.height = talentTree
                    .system.display.height
                    ? `${talentTree.system.display.height}px`
                    : 'auto';
                void this.talentTreeViewComponent.resize();
            });
        } else {
            // Set position
            this.setPosition({
                width: 550,
                height: 'auto',
            });
        }
    }

    /* --- Context --- */

    public async _prepareContext(
        options: DeepPartial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        // Get context actor
        const contextActor = this.item.actor?.isCharacter()
            ? this.item.actor
            : undefined;

        // Look up talent tree
        const talentTree = this.item.system.talentTree
            ? ((await fromUuid(this.item.system.talentTree)) as unknown as
                  | TalentTreeItem
                  | undefined)
            : undefined;

        // Get non-core (locked) skills
        const linkedSkillsOptions = Object.entries(CONFIG.COSMERE.skills)
            .filter(([key, config]) => !config.core)
            .reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {},
            );

        return {
            ...(await super._prepareContext(options)),

            linkedSkillsOptions,
            talentTree,
            contextActor,
        };
    }
}
