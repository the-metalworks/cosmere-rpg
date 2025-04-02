import { RawDocumentData } from '@system/types/utils';
import { SYSTEM_ID } from '@system/constants';

export function handleDocumentMigrationError(
    error: unknown,
    documentType: string,
    document: RawDocumentData<unknown>,
): void {
    console.log(document);

    ui.notifications.warn(
        game.i18n!.format('COSMERE.Migration.DocumentMigrationFailed', {
            name: document.name,
            sort: game.i18n!.localize(`DOCUMENT.${documentType}`),
            type: game.i18n!.localize(`TYPES.${documentType}.${document.type}`),
            error:
                error instanceof Error
                    ? `${error.name}: ${error.message}`
                    : 'Unknown error',
        }),
    );

    console.warn(`[${SYSTEM_ID}] Failed to migrate document`, error, document);
}
