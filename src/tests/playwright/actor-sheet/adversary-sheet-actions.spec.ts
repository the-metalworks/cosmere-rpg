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

    await testAdversary.checkAllStats({});

    // Update strength, check new values
    await testAdversary.updateAttribute(Attribute.Strength, 1);
    await testAdversary.checkAllStats({
        attributes: {
            [Attribute.Strength]: 1,
        },
        defenses: {
            [AttributeGroup.Physical]: 11,
        },
    });

    // Update speed, check new values
    await testAdversary.updateAttribute(Attribute.Speed, 2);
    await testAdversary.checkAllStats({
        attributes: {
            [Attribute.Strength]: 1,
            [Attribute.Speed]: 2,
        },
        defenses: {
            [AttributeGroup.Physical]: 13,
        },
    });
});

test('Edit mode', async ({ authenticatedPage: page, createActor }) => {
    const testAdversary = await createActor(
        'Test Character',
        ActorType.Adversary,
    );
    const testAdversarySheet = testAdversary.locator;

    await expect(
        testAdversarySheet
            .getByRole('listitem')
            .filter({ hasText: 'Features Action Cost Resources' }),
    ).toBeVisible();
    await expect(
        testAdversarySheet
            .getByRole('listitem')
            .filter({ hasText: 'Weapons Action Cost Resources' }),
    ).toBeVisible();
    await expect(
        testAdversarySheet
            .getByRole('listitem')
            .filter({ hasText: 'Actions Action Cost Resources' }),
    ).toBeVisible();
    await expect(
        testAdversarySheet
            .locator('ul:nth-child(1) > .item > .details > .controls > a')
            .first(),
    ).toBeVisible();
    await expect(
        testAdversarySheet
            .locator('ul:nth-child(2) > .item > .details > .controls > a')
            .first(),
    ).not.toBeVisible();
    await expect(
        testAdversarySheet
            .locator('ul:nth-child(3) > .item > .details > .controls > a')
            .first(),
    ).toBeVisible();
    await expect(
        testAdversarySheet.locator('select[name="system.role"]'),
    ).toBeVisible();
    await expect(
        testAdversarySheet.locator('select[name="system.size"]'),
    ).toBeVisible();
    await expect(testAdversarySheet.locator('.type > a')).toBeVisible();
    await expect(
        testAdversarySheet.locator('div').filter({ hasText: 'Skills' }).nth(3),
    ).toBeVisible();
    await expect(
        testAdversarySheet
            .locator('div')
            .filter({ hasText: 'Expertises' })
            .nth(3),
    ).toBeVisible();
    await expect(
        testAdversarySheet
            .locator('div')
            .filter({ hasText: 'Immunities' })
            .nth(3),
    ).toBeVisible();

    // Toggle edit mode off
    await testAdversarySheet.locator('.fa-solid.fa-pen').click();
    await expect(
        testAdversarySheet.getByText('Minion o Medium Humanoid'),
    ).toBeVisible();

    await expect(
        testAdversarySheet
            .getByRole('listitem')
            .filter({ hasText: 'Features Action Cost Resources' }),
    ).not.toBeVisible();
    await expect(
        testAdversarySheet
            .getByRole('listitem')
            .filter({ hasText: 'Weapons Action Cost Resources' }),
    ).not.toBeVisible();
    await expect(
        testAdversarySheet
            .getByRole('listitem')
            .filter({ hasText: 'Actions Action Cost Resources' }),
    ).not.toBeVisible();
    await expect(
        testAdversarySheet
            .locator('ul:nth-child(1) > .item > .details > .controls > a')
            .first(),
    ).not.toBeVisible();
    await expect(
        testAdversarySheet
            .locator('ul:nth-child(2) > .item > .details > .controls > a')
            .first(),
    ).not.toBeVisible();
    await expect(
        testAdversarySheet
            .locator('ul:nth-child(3) > .item > .details > .controls > a')
            .first(),
    ).not.toBeVisible();
    await expect(
        testAdversarySheet.locator('select[name="system.role"]'),
    ).not.toBeVisible();
    await expect(
        testAdversarySheet.locator('select[name="system.size"]'),
    ).not.toBeVisible();
    await expect(testAdversarySheet.locator('.type > a')).not.toBeVisible();
    await expect(
        testAdversarySheet.locator('div').filter({ hasText: 'Skills' }).nth(3),
    ).not.toBeVisible();
    await expect(
        testAdversarySheet
            .locator('div')
            .filter({ hasText: 'Expertises' })
            .nth(3),
    ).not.toBeVisible();
    await expect(
        testAdversarySheet
            .locator('div')
            .filter({ hasText: 'Immunities' })
            .nth(3),
    ).not.toBeVisible();
});
