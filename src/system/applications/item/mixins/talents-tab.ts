import { TalentTreeItem } from '@system/documents/item';
import { ConstructorOf, DeepPartial, AnyObject } from '@system/types/utils';
import { Talent } from '@system/types/item';

// Components
import { TalentTreeViewComponent } from '../components/talent-tree/talent-tree-view';

// Base sheet
import { BaseItemSheet } from '../base';

// Mixins
import { ApplicationTab } from '../../mixins/tabs';

export function TalentsTabMixin<
    T extends ConstructorOf<BaseItemSheet> & {
        TABS: Record<string, ApplicationTab>;
    },
>(base: T) {
    return class mixin extends base {
        static TABS = foundry.utils.mergeObject(
            foundry.utils.deepClone(super.TABS),
            {
                talents: {
                    label: 'COSMERE.Item.Sheet.Tabs.Talents',
                    icon: '<i class="fa-solid fa-sitemap"></i>',
                    sortIndex: 14,
                },
            },
        );

        private get talentTreeViewComponent() {
            return Object.values(this.components).find(
                (component) => component instanceof TalentTreeViewComponent,
            )!;
        }

        /* --- Lifecycle --- */

        protected _onFirstRender(context: AnyObject, options: unknown): void {
            super._onFirstRender(context, options);

            // Invoke on tab change
            void this.onTabChange();
        }

        protected override async onTabChange() {
            if (this.tab === 'talents') {
                // Look up talent tree
                const talentTree = this.item.system.talentTree
                    ? ((await fromUuid(
                          this.item.system.talentTree,
                      )) as unknown as TalentTreeItem | undefined)
                    : undefined;
                if (!talentTree) return;

                // Set position
                this.setPosition({
                    width: talentTree.system.display.width
                        ? Math.max(talentTree.system.display.width + 41, 550)
                        : this.position.width,
                    height: talentTree.system.display.height
                        ? talentTree.system.display.height + 170
                        : 'auto',
                });

                setTimeout(() => {
                    this.talentTreeViewComponent.element!.style.height =
                        talentTree.system.display.height
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

            return {
                ...(await super._prepareContext(options)),

                talentTree,
                contextActor,
            };
        }
    };
}
