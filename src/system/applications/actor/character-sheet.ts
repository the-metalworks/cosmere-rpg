import './components';

import { ItemType } from '@system/types/cosmere';
import type { CharacterActor } from '@system/documents';
import { SYSTEM_ID } from '@src/system/constants';

// Base
import { BaseActorSheet } from './base';
import { TEMPLATES } from '@src/system/utils/templates';

// Svelte
import CharacterHeader from '../../ui/character/CharacterHeader.svelte';
import CharacterGoalsTab from '../../ui/character/CharacterGoalsTab.svelte';
import { getCharacterHeaderProps } from '../../ui/adapters/character-header';
import { getCharacterGoalsTabProps } from '../../ui/adapters/character-goals-tab';
import { mountSvelteComponent } from '../../ui/utils/mount-svelte'

const enum CharacterSheetTab {
    Details = 'details',
    Talents = 'talents',
    Goals = 'goals',
}

export class CharacterSheet extends BaseActorSheet {
    declare actor: CharacterActor;
    private _headerComponent?: any;
    private _goalsComponent?: any;

    static DEFAULT_OPTIONS = {
        classes: [SYSTEM_ID, 'sheet', 'actor', 'character'] as string[],
        position: {
            width: 850,
            height: 1000,
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            header: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_HEADER}`,
            },
            content: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_CONTENT}`,
            },
        },
    );

    static TABS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.TABS),
        {
            [CharacterSheetTab.Details]: {
                label: 'COSMERE.Actor.Sheet.Tabs.Details',
                icon: '<i class="fa-solid fa-feather-pointed"></i>',
                sortIndex: 0,
            },

            [CharacterSheetTab.Talents]: {
                label: 'COSMERE.Actor.Sheet.Tabs.Talents',
                icon: '<i class="fa-solid fa-book"></i>',
                sortIndex: 1,
            },

            [CharacterSheetTab.Goals]: {
                label: 'COSMERE.Actor.Sheet.Tabs.Goals',
                icon: '<i class="fa-solid fa-list"></i>',
                sortIndex: 25,
            },
        },
    );

    /* --- Context --- */

    public async _prepareContext(
        options: Partial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        // Find the ancestry
        const ancestryItem = this.actor.items.find((item) => item.isAncestry());

        // Find all paths
        const pathItems = this.actor.items.filter((item) => item.isPath());

        // Split paths by type
        const pathTypes = pathItems
            .map((item) => item.system.type)
            .filter((v, i, self) => self.indexOf(v) === i); // Filter out duplicates

        return {
            ...(await super._prepareContext(options)),

            pathTypes: pathTypes.map((type) => ({
                type,
                typeLabel: CONFIG.COSMERE.paths.types[type].label,
                paths: pathItems.filter((i) => i.system.type === type),
            })),

            ancestryLabel:
                ancestryItem?.name ??
                game.i18n?.localize('COSMERE.Item.Type.Ancestry.label'),
        };
    }

    protected override async _onRender(context: any, options: any) {
        await super._onRender(context, options);

        if (!options.parts?.includes('header')) { return; }

        const element = (this as any).element as HTMLElement;
        const headerRoot = element.querySelector('.svelte-header-root');

        if (!headerRoot) { return; }

        this._headerComponent = mountSvelteComponent(
            this._headerComponent,
            CharacterHeader,
            headerRoot as HTMLElement,
            getCharacterHeaderProps(
                this.actor,
                this.mode === 'edit' && this.isEditable,
                async (value: string) => {
                    await this.actor.update({ name: value });
                },
                async (value: number) => {
                    await this.actor.update({ 'system.level': value } as any);
                },
            ),
        );

        const goalsRoot = element.querySelector('.svelte-goals-root');

        console.log('Goals mount check', {
            goalsRoot: !!element.querySelector('.svelte-goals-root'),
            goalsTab: context.tabsMap?.goals,
            parts: options.parts,
        });

        if (goalsRoot) {
            const goalsTab = context.tabsMap?.goals;

            this._goalsComponent = mountSvelteComponent(
                this._goalsComponent,
                CharacterGoalsTab,
                goalsRoot as HTMLElement,
                getCharacterGoalsTabProps(
                    this.actor,
                    goalsTab.cssClass ?? '',
                    this.isEditable,
                    async (value: string) => {
                        await this.actor.update({ 'system.purpose': value } as any);
                    },
                    async (value: string) => {
                        await this.actor.update({ 'system.obstacle': value } as any);
                    },
                    async (
                        goalId: string,
                        direction: 'increase' | 'decrease',
                    ) => {
                        const goal = this.actor.items.get(goalId);
                        if (!goal?.isGoal()) return;
                        const newLevel = 
                            direction === 'increase' 
                            ? Math.min(goal.system.level + 1, 3) 
                            : Math.max(goal.system.level - 1, 0);
                        await goal.update({ 'system.level': newLevel } as any);
                    },
                    async () => {
                        const goal = await Item.create(
                            {
                                type: ItemType.Goal,
                                name: game.i18n.localize('COSMERE.Actor.Sheet.Details.Goals.New'),
                                system: { level: 0 },
                            },
                            { parent: this.actor },
                        );
                        goal?.sheet?.render(true);
                    },
                    async () => {
                        const current = this.actor.getFlag( SYSTEM_ID, 'goals.hide-completed') ?? false;
                        await this.actor.setFlag( SYSTEM_ID, 'goals.hide-completed', !current );
                    },
                ),
            );
        }
    }
}