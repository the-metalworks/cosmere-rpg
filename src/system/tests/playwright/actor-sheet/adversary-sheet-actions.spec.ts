import {
    ActorType,
    Attribute,
    AttributeGroup,
} from '@src/system/types/cosmere';
import { test, expect } from '../fixtures';
import { html5DragAndDrop } from '../helpers/drag-drop';

test('Resources/Attribute/Defenses', async ({
    authenticatedPage: page,
    createActor,
}) => {
    const testAdversary = await createActor(
        'Test Adversary',
        ActorType.Adversary,
    );

    await page.pause();
    await testAdversary.checkResource('Health', 0, 0);
    await testAdversary.checkResource('Focus', 0, 0);
    await testAdversary.checkResource('Investiture', 0, 0);
    await testAdversary.checkAttribute(Attribute.Strength, 0);
    await testAdversary.checkAttribute(Attribute.Speed, 0);
    await testAdversary.checkAttribute(Attribute.Intellect, 0);
    await testAdversary.checkAttribute(Attribute.Willpower, 0);
    await testAdversary.checkAttribute(Attribute.Awareness, 0);
    await testAdversary.checkAttribute(Attribute.Presence, 0);
    await testAdversary.checkDefense(AttributeGroup.Physical, 10);
    await testAdversary.checkDefense(AttributeGroup.Cognitive, 10);
    await testAdversary.checkDefense(AttributeGroup.Spiritual, 10);

    // Update strength, check new values
    await testAdversary.updateAttribute(Attribute.Strength, 1);
    await testAdversary.checkResource('Health', 0, 0);
    await testAdversary.checkResource('Focus', 0, 0);
    await testAdversary.checkAttribute(Attribute.Strength, 1);
    await testAdversary.checkAttribute(Attribute.Speed, 0);
    await testAdversary.checkDefense(AttributeGroup.Physical, 11);
    await testAdversary.checkDefense(AttributeGroup.Cognitive, 10);

    // Update speed, check new values
    await testAdversary.updateAttribute(Attribute.Speed, 2);
    await testAdversary.checkResource('Health', 0, 0);
    await testAdversary.checkResource('Focus', 0, 0);
    await testAdversary.checkAttribute(Attribute.Strength, 1);
    await testAdversary.checkAttribute(Attribute.Speed, 2);
    await testAdversary.checkDefense(AttributeGroup.Physical, 13);
    await testAdversary.checkDefense(AttributeGroup.Cognitive, 10);

    // // Update health to less than max
    // await testCharacter.updateResource('Health', 5);
    // await testCharacter.checkResource('Health', 5, 11);

    // // Update health to more than max
    // await testCharacter.updateResource('Health', 100);
    // await testCharacter.checkResource('Health', 11, 11);
});

test('Edit mode', async ({ authenticatedPage: page, createActor }) => {
    const testAdversary = await createActor(
        'Test Character',
        ActorType.Adversary,
    );
    const testAdversarySheet = testAdversary.locator;

    await expect(
        page
            .getByRole('listitem')
            .filter({ hasText: 'Features Action Cost Resources' }),
    ).toBeVisible();
    await expect(
        page
            .getByRole('listitem')
            .filter({ hasText: 'Weapons Action Cost Resources' }),
    ).toBeVisible();
    await expect(
        page
            .getByRole('listitem')
            .filter({ hasText: 'Actions Action Cost Resources' }),
    ).toBeVisible();
    await expect(
        page
            .locator('ul:nth-child(1) > .item > .details > .controls > a')
            .first(),
    ).toBeVisible();
    await expect(
        page
            .locator('ul:nth-child(2) > .item > .details > .controls > a')
            .first(),
    ).not.toBeVisible();
    await expect(
        page
            .locator('ul:nth-child(3) > .item > .details > .controls > a')
            .first(),
    ).toBeVisible();
    await expect(page.locator('select[name="system.role"]')).toBeVisible();
    await expect(page.locator('select[name="system.size"]')).toBeVisible();
    await expect(page.locator('.type > a')).toBeVisible();
    await expect(
        page.locator('div').filter({ hasText: 'Skills' }).nth(3),
    ).toBeVisible();
    await expect(
        page.locator('div').filter({ hasText: 'Expertises' }).nth(3),
    ).toBeVisible();
    await expect(
        page.locator('div').filter({ hasText: 'Immunities' }).nth(3),
    ).toBeVisible();

    // Toggle edit mode off
    await page.locator('.fa-solid.fa-pen').click();
    await expect(page.getByText('Minion o Medium Humanoid')).toBeVisible();

    await expect(
        page
            .getByRole('listitem')
            .filter({ hasText: 'Features Action Cost Resources' }),
    ).not.toBeVisible();
    await expect(
        page
            .getByRole('listitem')
            .filter({ hasText: 'Weapons Action Cost Resources' }),
    ).not.toBeVisible();
    await expect(
        page
            .getByRole('listitem')
            .filter({ hasText: 'Actions Action Cost Resources' }),
    ).not.toBeVisible();
    await expect(
        page
            .locator('ul:nth-child(1) > .item > .details > .controls > a')
            .first(),
    ).not.toBeVisible();
    await expect(
        page
            .locator('ul:nth-child(2) > .item > .details > .controls > a')
            .first(),
    ).not.toBeVisible();
    await expect(
        page
            .locator('ul:nth-child(3) > .item > .details > .controls > a')
            .first(),
    ).not.toBeVisible();
    await expect(page.locator('select[name="system.role"]')).not.toBeVisible();
    await expect(page.locator('select[name="system.size"]')).not.toBeVisible();
    await expect(page.locator('.type > a')).not.toBeVisible();
    await expect(
        page.locator('div').filter({ hasText: 'Skills' }).nth(3),
    ).not.toBeVisible();
    await expect(
        page.locator('div').filter({ hasText: 'Expertises' }).nth(3),
    ).not.toBeVisible();
    await expect(
        page.locator('div').filter({ hasText: 'Immunities' }).nth(3),
    ).not.toBeVisible();
});
