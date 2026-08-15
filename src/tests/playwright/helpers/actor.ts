import { expect, Locator, Page } from '@playwright/test';
import {
    ActorType,
    Attribute,
    AttributeGroup,
} from '@src/system/types/cosmere';
import { paramsFromHook } from './hooks';
import { DeepPartial } from '@league-of-foundry-developers/foundry-vtt-types/utils';
import { clickAway } from './utils';

interface ActorSheetRefData {
    id: string;
    uuid: string;
    name: string;
    type: ActorType;
}

export interface ActorExpectedStats {
    resources: {
        Health: {
            value: number;
            max: number;
        };
        Focus: {
            value: number;
            max: number;
        };
        Investiture: {
            value: number;
            max: number;
        };
    };
    attributes: {
        [Attribute.Strength]: number;
        [Attribute.Speed]: number;
        [Attribute.Intellect]: number;
        [Attribute.Willpower]: number;
        [Attribute.Awareness]: number;
        [Attribute.Presence]: number;
    };
    defenses: {
        [AttributeGroup.Physical]: number;
        [AttributeGroup.Cognitive]: number;
        [AttributeGroup.Spiritual]: number;
    };
}

const CharacterDefaultStats: ActorExpectedStats = {
    resources: {
        Health: {
            value: 0,
            max: 10,
        },
        Focus: {
            value: 0,
            max: 2,
        },
        Investiture: {
            value: 0,
            max: 0,
        },
    },
    attributes: {
        [Attribute.Strength]: 0,
        [Attribute.Speed]: 0,
        [Attribute.Intellect]: 0,
        [Attribute.Willpower]: 0,
        [Attribute.Awareness]: 0,
        [Attribute.Presence]: 0,
    },
    defenses: {
        [AttributeGroup.Physical]: 10,
        [AttributeGroup.Cognitive]: 10,
        [AttributeGroup.Spiritual]: 10,
    },
};

const AdversaryDefaultStats: ActorExpectedStats = {
    resources: {
        ['Health']: {
            value: 0,
            max: 0,
        },
        ['Focus']: {
            value: 0,
            max: 0,
        },
        ['Investiture']: {
            value: 0,
            max: 0,
        },
    },
    attributes: {
        [Attribute.Strength]: 0,
        [Attribute.Speed]: 0,
        [Attribute.Intellect]: 0,
        [Attribute.Willpower]: 0,
        [Attribute.Awareness]: 0,
        [Attribute.Presence]: 0,
    },
    defenses: {
        [AttributeGroup.Physical]: 10,
        [AttributeGroup.Cognitive]: 10,
        [AttributeGroup.Spiritual]: 10,
    },
};

export class ActorSheetRef {
    public readonly locator: Locator;
    public readonly id: string;
    public readonly uuid: string;
    public readonly name: string;
    public readonly type: ActorType;

    constructor(
        private readonly page: Page,
        sheetRefData: ActorSheetRefData,
    ) {
        this.id = sheetRefData.id;
        this.uuid = sheetRefData.uuid;
        this.name = sheetRefData.name;
        this.type = sheetRefData.type;
        if (this.type == ActorType.Character) {
            this.locator = page.locator(`#CharacterSheet-Actor-${this.id}`);
        } else {
            this.locator = page.locator(`#AdversarySheet-Actor-${this.id}`);
        }
    }

    public static async create(
        page: Page,
        name: string,
        type: ActorType,
    ): Promise<ActorSheetRefData> {
        await page.getByRole('tab', { name: 'Actors' }).click();
        await page.getByRole('button', { name: ' Create Actor' }).click();
        await page.getByRole('textbox', { name: 'Character' }).click();
        await page.getByRole('textbox', { name: 'Character' }).fill(name);
        await page.getByRole('combobox').selectOption(type);
        const newActorPromise = paramsFromHook(page, 'createActor');
        await page.getByRole('button', { name: ' Create Actor' }).click();
        const [createdActor, createOptions, id] = await newActorPromise;
        expect(createdActor.name == name);
        expect(createdActor.type == type);
        expect(createdActor.id);
        expect(createdActor.uuid);
        const actorSheetRef = {
            id: createdActor.id!,
            uuid: createdActor.uuid,
            name: createdActor.name,
            type: createdActor.type as ActorType,
        };
        let locString;

        if (createdActor.type == ActorType.Character) {
            locString = `#CharacterSheet-Actor-${createdActor.id}`;
        } else {
            locString = `#AdversarySheet-Actor-${createdActor.id}`;
        }
        await expect(page.locator(locString)).toHaveCount(1);
        return actorSheetRef;
    }

    public async delete() {
        await this.page.evaluate(async (id) => {
            await game.actors?.get(id)?.delete();
        }, this.id);
    }

    public async checkResource(
        resourceLabel: string,
        expectedVal: number,
        expectedMax: number,
    ) {
        const resourceBar = this.locator
            .locator('app-actor-resource')
            .filter({ hasText: resourceLabel });
        await expect(resourceBar).toHaveCount(1);
        await expect(resourceBar).toContainText(
            `${expectedVal}\n/\n${expectedMax}`,
        );
    }

    public async checkAttribute(attribute: Attribute, expectedVal: number) {
        const attributeInput = this.locator.locator(
            `input[name="system.attributes.${attribute}.value"]`,
        );
        await expect(attributeInput).toHaveCount(1);
        await expect(attributeInput).toHaveValue(`${expectedVal}`);
    }

    public async checkDefense(
        attributeGroup: AttributeGroup,
        expectedVal: number,
    ) {
        const defenseDisplay = this.locator
            .locator(`div.attribute-group[data-id=${attributeGroup}]`)
            .locator(`div.sheet-stack.defense`);
        await expect(defenseDisplay).toHaveCount(1);
        await expect(defenseDisplay).toContainText(`${expectedVal}`);
    }

    public async checkAllStats(
        expectedVariantStats: DeepPartial<ActorExpectedStats>,
    ) {
        const defaults =
            this.type === ActorType.Character
                ? CharacterDefaultStats
                : AdversaryDefaultStats;

        const expectedActorStats: ActorExpectedStats = {
            resources: {
                Health: {
                    ...defaults.resources.Health,
                    ...expectedVariantStats.resources?.Health,
                },
                Focus: {
                    ...defaults.resources.Focus,
                    ...expectedVariantStats.resources?.Focus,
                },
                Investiture: {
                    ...defaults.resources.Investiture,
                    ...expectedVariantStats.resources?.Investiture,
                },
            },
            attributes: {
                ...defaults.attributes,
                ...expectedVariantStats.attributes,
            },
            defenses: {
                ...defaults.defenses,
                ...expectedVariantStats.defenses,
            },
        };

        for (const [resourceString, resourceData] of Object.entries(
            expectedActorStats.resources,
        )) {
            await this.checkResource(
                resourceString,
                resourceData.value,
                resourceData.max,
            );
        }
        for (const [attributeString, attributeData] of Object.entries(
            expectedActorStats.attributes,
        )) {
            await this.checkAttribute(
                attributeString as Attribute,
                attributeData,
            );
        }
        for (const [defenseString, defenseData] of Object.entries(
            expectedActorStats.defenses,
        )) {
            await this.checkDefense(
                defenseString as AttributeGroup,
                defenseData,
            );
        }
    }

    public async updateAttribute(attribute: Attribute, newVal: number) {
        await this.locator
            .locator(`input[name="system.attributes.${attribute}.value"]`)
            .click();
        await this.locator
            .locator(`input[name="system.attributes.${attribute}.value"]`)
            .fill(`${newVal}`);
        await clickAway(this.page);
    }

    public async updateResource(resourceLabel: string, newVal: number) {
        const resourceBar = this.locator
            .locator('app-actor-resource')
            .filter({ hasText: resourceLabel });
        await resourceBar.click();
        const resourceBarInput = resourceBar.locator(`input`);
        await resourceBarInput.fill(`${newVal}`);
        await clickAway(this.page);
    }

    public async switchTab() {}
    public async switchToActionsTab() {
        await this.locator.locator('a').filter({ hasText: '3' }).click();
    }

    public get currentTabLocator() {
        return this.locator.locator('div.tab.tab-content.active');
    }

    public async checkHasAction(
        name: string,
        cost: string,
        consume = '—',
        resources = '—',
        searchLocator = this.locator.locator('app-actor-actions-list'),
    ) {
        await expect(
            searchLocator.getByText(`${name} ${cost} ${consume} ${resources}`),
        ).toBeVisible();
    }

    public async actionLocator(name: string, searchLocator = this.locator) {
        const actionLocator = searchLocator
            .locator('app-actor-actions-list li')
            .filter({ has: this.page.locator('span.name', { hasText: name }) });
        await expect(actionLocator).toHaveCount(1);
        return actionLocator;
    }

    public async itemListSectionLocator(
        title: string,
        searchLocator = this.currentTabLocator,
    ) {
        const listSectionLocator = searchLocator
            .locator('ul.item-list.collapsible')
            .filter({
                has: this.page.locator('span.title', { hasText: title }),
            });
        await expect(listSectionLocator).toHaveCount(1);
        return listSectionLocator;
    }
}
