import { expect, Locator, Page } from '@playwright/test';
import {
    ActorType,
    Attribute,
    AttributeGroup,
} from '@src/system/types/cosmere';
import { paramsFromHook } from './hooks';

interface ActorSheetRefData {
    id: string;
    uuid: string;
    name: string;
    type: ActorType;
}

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
        this.locator = page.locator(`#CharacterSheet-Actor-${this.id}`);
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
        await expect(
            page.locator(`#CharacterSheet-Actor-${createdActor.id}`),
        ).toHaveCount(1);
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

    public async updateAttribute(attribute: Attribute, newVal: number) {
        await this.locator
            .locator(`input[name="system.attributes.${attribute}.value"]`)
            .click();
        await this.locator
            .locator(`input[name="system.attributes.${attribute}.value"]`)
            .fill(`${newVal}`);
        await this.locator.getByRole('banner').click();
    }

    public async updateResource(resourceLabel: string, newVal: number) {
        const resourceBar = this.locator
            .locator('app-actor-resource')
            .filter({ hasText: resourceLabel });
        await resourceBar.click();
        const resourceBarInput = resourceBar.locator(`input`);
        await resourceBarInput.fill(`${newVal}`);
        await this.locator.getByRole('banner').click();
    }
}
