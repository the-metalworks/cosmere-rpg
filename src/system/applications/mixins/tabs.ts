import { ConstructorOf, AnyObject } from '@system/types/utils';

// Constants
const PRIMARY_TAB_GROUP = 'primary';

export interface ApplicationTab {
    /**
     * The label to apply to this tab
     */
    label: string;

    /**
     * The index for sorting the tabs
     *
     * @default - One plus the index at which the tab id is encountered in `TABS` multiplied by 10 - (1 + i) * 10
     */
    sortIndex?: number;

    /**
     * An optional icon to show for this tab
     */
    icon?: string;

    /**
     * The tab group for which this tab should be active
     *
     * @default 'primary'
     */
    group?: string;

    /**
     * Whether this tab is enabled or not.
     * If this is set to false, the tab will not be shown in the UI.
     *
     * @default true
     */
    enabled?: boolean;
}

export interface TabApplicationRenderOptions
    extends foundry.applications.api.ApplicationV2.RenderOptions {
    /**
     * The initial tab to show for the primary tab group, when rendering the application.
     */
    tab?: string;
}

/**
 * Mixin that adds standardized tabs to an ApplicationV2
 */
export function TabsApplicationMixin<
    T extends ConstructorOf<
        // NOTE: Use of any as the mixin doesn't care about the types
        // and we don't want to interfere with the final type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        foundry.applications.api.ApplicationV2<any, any, any>
    >,
>(base: T) {
    return class mixin extends base {
        /**
         * Tabs available for this Application
         */
        public static TABS: Record<string, ApplicationTab> = {};

        public tabGroups: Record<string, string> = {};

        private _tabs?: Record<string, ApplicationTab>;

        public get tab(): string {
            return this.tabGroups[PRIMARY_TAB_GROUP] ?? '';
        }

        public get tabs(): Record<string, ApplicationTab> {
            if (!this._tabs)
                this._tabs = (this.constructor as typeof mixin).TABS;

            return this._tabs;
        }

        public override changeTab(
            tab: string,
            group: string,
            options?: AnyObject,
        ): void {
            super.changeTab(tab, group, options);

            // Invoke tab change
            this.onTabChange(tab, group);
        }

        /* --- Lifecycle --- */

        protected onTabChange(tab: string, group: string) {}

        /* --- Context --- */

        protected _onFirstRender(
            context: unknown,
            options: TabApplicationRenderOptions,
        ): void {
            super._onFirstRender(context, options);

            // Set the initial tab for the primary tab group
            if (
                options.tab &&
                this.tabGroups[PRIMARY_TAB_GROUP] !== options.tab &&
                this.tabs[options.tab]
            ) {
                this.changeTab(options.tab, PRIMARY_TAB_GROUP);
            }
        }

        public async _prepareContext(
            options: Partial<foundry.applications.api.ApplicationV2.RenderOptions>,
        ) {
            // Get tabs list
            const tabsList = this.tabs;

            // Construct tabs data
            const tabsData = Object.entries(tabsList)
                .map(([tabId, tab], i) => ({
                    ...tab,
                    id: tabId,
                    group: tab.group ?? PRIMARY_TAB_GROUP,
                    sortIndex: tab.sortIndex ?? (1 + i) * 10,
                }))
                .sort((a, b) => a.sortIndex - b.sortIndex);

            // Get all tab groups used by tabs of this application
            const usedGroups = tabsData
                .map((tab) => tab.group)
                .filter((v, i, self) => self.indexOf(v) === i);

            // Ensure that the used tab groups are set up
            usedGroups.forEach((groupId) => {
                if (!this.tabGroups[groupId]) {
                    this.tabGroups[groupId] = tabsData.find(
                        (tab) => tab.group === groupId,
                    )!.id;
                }
            });

            // Construct tabs
            const tabs = tabsData
                .map((tab) => {
                    const active = this.tabGroups[tab.group] === tab.id;
                    const cssClass = active ? 'active' : '';

                    return {
                        ...tab,
                        active,
                        cssClass,
                    };
                })
                .filter((tab) => tab.enabled !== false);

            // Construct tabs map
            const tabsMap = tabs.reduce(
                (map, tab) => {
                    return {
                        ...map,
                        [tab.id]: tab,
                    };
                },
                {} as Record<string, ApplicationTab>,
            );

            return {
                ...(await super._prepareContext(options)),

                tabs,
                tabsMap,
                tabGroups: this.tabGroups,
                activeTab: this.tabGroups.primary,
            };
        }
    };
}
