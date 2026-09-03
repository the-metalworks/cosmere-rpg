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
    const testCharacter = await createActor(
        'Test Character',
        ActorType.Character,
    );
    await testCharacter.checkAllStats({});

    // Update strength, check new values
    await testCharacter.updateAttribute(Attribute.Strength, 1);
    await testCharacter.checkAllStats({
        resources: {
            Health: {
                value: 1,
                max: 11,
            },
        },
        attributes: {
            [Attribute.Strength]: 1,
        },
        defenses: {
            [AttributeGroup.Physical]: 11,
        },
    });

    // Update speed, check new values
    await testCharacter.updateAttribute(Attribute.Speed, 2);
    await testCharacter.checkAllStats({
        resources: {
            Health: {
                value: 1,
                max: 11,
            },
        },
        attributes: {
            [Attribute.Strength]: 1,
            [Attribute.Speed]: 2,
        },
        defenses: {
            [AttributeGroup.Physical]: 13,
        },
    });

    // Update health to less than max
    await testCharacter.updateResource('Health', 5);
    await testCharacter.checkResource('Health', 5, 11);

    // Update health to more than max
    await testCharacter.updateResource('Health', 100);
    await testCharacter.checkResource('Health', 11, 11);
});

test('Ancestry/Culture/Path Drag and Drop', async ({
    authenticatedPage: page,
    createActor,
}) => {
    const testCharacter = await createActor(
        'Test Character',
        ActorType.Character,
    );
    const testCharacterSheet = testCharacter.locator;
    await testCharacter.checkAllStats({});
    await page.getByRole('tab', { name: 'Compendium Packs' }).click();
    await page
        .locator('span')
        .filter({ hasText: 'Stormlight Starter Rules' })
        .click();

    // Add Human ancestry
    await page.locator('a').filter({ hasText: 'Ancestries' }).click();
    const stormlightAncestriesFolderLocator = page
        .locator('#compendium-cosmere-rpg_ancestries li.folder')
        .filter({ hasText: 'Stormlight' });
    await stormlightAncestriesFolderLocator.click();

    const humanAncestryElement =
        stormlightAncestriesFolderLocator.getByText('Human');
    await html5DragAndDrop(page, humanAncestryElement, testCharacterSheet);
    await expect(
        testCharacterSheet.locator('app-character-ancestry'),
    ).toContainText('Human Ancestry');
    await page
        .locator('#compendium-cosmere-rpg_ancestries')
        .getByRole('button', { name: 'Close Window' })
        .click();

    // Add Herdazian Culture
    await page.locator('a').filter({ hasText: 'Cultures' }).click();
    const herdazianCultureElement = page.getByText('Herdazian');
    await html5DragAndDrop(page, herdazianCultureElement, testCharacterSheet);
    await expect(
        testCharacterSheet.locator('app-character-culture'),
    ).toContainText('Herdazian Culture');
    await page
        .locator('#compendium-cosmere-rpg_cultures')
        .getByRole('button', { name: 'Close Window' })
        .click();

    // Add Agent path

    await page.locator('a').filter({ hasText: 'Heroic Paths' }).click();
    await page.locator('span').filter({ hasText: 'Agent' }).click();
    const agentPathElement = page.locator('a').filter({ hasText: /^Agent$/ });
    await html5DragAndDrop(page, agentPathElement, testCharacterSheet);
    await expect(
        testCharacterSheet
            .locator('app-actor-skill')
            .filter({ hasText: 'Insight' }),
    ).toContainText('+ 1 Insight AWA');
    await page.locator('a').filter({ hasText: '3' }).click();
    await page.locator('.sheet-navigation > a:nth-child(2)').click();
    await expect(page.locator('app-character-talents-list')).toContainText(
        'Agent Talents',
    );
    await expect(page.locator('app-character-talents-list')).toContainText(
        'Opportunist',
    );
});

test('Edit mode', async ({ authenticatedPage: page, createActor }) => {
    const testCharacter = await createActor(
        'Test Character',
        ActorType.Character,
    );
    const testCharacterSheet = testCharacter.locator;

    await expect(
        testCharacterSheet.locator(
            'div:nth-child(1) > .attributes > .sheet-stack.defense > .container > .config-icon',
        ),
    ).toBeVisible();
    await expect(
        testCharacterSheet.locator(
            'div:nth-child(2) > .attributes > .sheet-stack.defense > .container > .config-icon',
        ),
    ).toBeVisible();
    await expect(
        testCharacterSheet.locator(
            'div:nth-child(3) > .attributes > .sheet-stack.defense > .container > .config-icon',
        ),
    ).toBeVisible();
    await expect(
        testCharacterSheet.locator('.label > a').first(),
    ).toBeVisible();
    await expect(
        testCharacterSheet.locator(
            '.sheet-stack.derived-stat.movement > .label > a',
        ),
    ).toBeVisible();
    await expect(
        testCharacterSheet.locator(
            '.sheet-stack.derived-stat.recovery > .label > a',
        ),
    ).toBeVisible();
    await expect(
        testCharacterSheet.locator(
            '.sheet-stack.derived-stat.senses > .label > a',
        ),
    ).toBeVisible();
    await expect(
        testCharacterSheet.locator(
            '.sheet-stack.derived-stat.lift > .label > a',
        ),
    ).toBeVisible();
    await expect(
        testCharacterSheet.locator('.controls > a:nth-child(2)').first(),
    ).toBeVisible();
    await expect(
        testCharacterSheet.locator(
            '.resource.foc > .sidebar-header > .controls > a',
        ),
    ).toBeVisible();
    await expect(
        testCharacterSheet.locator(
            '.resource.inv > .sidebar-header > .controls > a',
        ),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('div')
            .filter({ hasText: 'Expertises' })
            .nth(3),
    ).toBeVisible();
    await expect(
        testCharacterSheet
            .locator('div')
            .filter({ hasText: 'Immunities' })
            .nth(3),
    ).toBeVisible();
    // Toggle edit mode off
    await testCharacterSheet.locator('.slider').click();
    await expect(
        testCharacterSheet.locator(
            'div:nth-child(1) > .attributes > .sheet-stack.defense > .container > .config-icon',
        ),
    ).not.toBeVisible();
    await expect(
        testCharacterSheet.locator(
            'div:nth-child(2) > .attributes > .sheet-stack.defense > .container > .config-icon',
        ),
    ).not.toBeVisible();
    await expect(
        testCharacterSheet.locator(
            'div:nth-child(3) > .attributes > .sheet-stack.defense > .container > .config-icon',
        ),
    ).not.toBeVisible();
    await expect(
        testCharacterSheet.locator('.label > a').first(),
    ).not.toBeVisible();
    await expect(
        testCharacterSheet.locator(
            '.sheet-stack.derived-stat.movement > .label > a',
        ),
    ).not.toBeVisible();
    await expect(
        testCharacterSheet.locator(
            '.sheet-stack.derived-stat.recovery > .label > a',
        ),
    ).not.toBeVisible();
    await expect(
        testCharacterSheet.locator(
            '.sheet-stack.derived-stat.senses > .label > a',
        ),
    ).not.toBeVisible();
    await expect(
        testCharacterSheet.locator(
            '.sheet-stack.derived-stat.lift > .label > a',
        ),
    ).not.toBeVisible();
    await expect(
        testCharacterSheet.locator('.controls > a:nth-child(2)').first(),
    ).not.toBeVisible();
    await expect(
        testCharacterSheet.locator(
            '.resource.foc > .sidebar-header > .controls > a',
        ),
    ).not.toBeVisible();
    await expect(
        testCharacterSheet.locator(
            '.resource.inv > .sidebar-header > .controls > a',
        ),
    ).not.toBeVisible();
    await expect(
        testCharacterSheet
            .locator('div')
            .filter({ hasText: 'Expertises' })
            .nth(3),
    ).not.toBeVisible();
    await expect(
        testCharacterSheet
            .locator('div')
            .filter({ hasText: 'Immunities' })
            .nth(3),
    ).not.toBeVisible();
});
