import { Page, Locator } from '@playwright/test';

export async function html5DragAndDrop(
    page: Page,
    source: Locator,
    target: Locator,
) {
    // One shared DataTransfer object travels from dragstart to drop
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());

    await source.dispatchEvent('dragstart', { dataTransfer });
    await target.dispatchEvent('dragenter', { dataTransfer });
    await target.dispatchEvent('dragover', { dataTransfer });
    await target.dispatchEvent('drop', { dataTransfer });
    await source.dispatchEvent('dragend', { dataTransfer });
}
