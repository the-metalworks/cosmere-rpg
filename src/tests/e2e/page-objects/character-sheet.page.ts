// Page object model for the cosmere-rpg character sheet.
// Selectors should be updated to match the actual sheet HTML structure
// once the proprietary source code is available.

import { Page, Locator } from '@playwright/test';

export class CharacterSheetPage {
    readonly page: Page;
    readonly sheet: Locator;
    readonly nameField: Locator;
    readonly closeButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.sheet = page.locator('.application.sheet.actor');
        this.nameField = this.sheet.locator('input[name="name"]');
        this.closeButton = this.sheet.locator('.header-button.close');
    }

    async waitForOpen(): Promise<void> {
        await this.sheet.waitFor({ state: 'visible', timeout: 10000 });
    }

    async close(): Promise<void> {
        await this.closeButton.click();
        await this.sheet.waitFor({ state: 'hidden' });
    }

    async getName(): Promise<string> {
        return await this.nameField.inputValue();
    }
}
