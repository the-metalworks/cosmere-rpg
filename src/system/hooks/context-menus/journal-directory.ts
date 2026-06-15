import { NodePrerequisiteTalentListComponent } from '@src/system/applications/item/components/talent-tree/node-prerequisite-talent-list';
import { RenameDirectoryEntryDialog } from '@system/applications/dialogs/rename-directory-entry';

interface MenuEntry {
    name: string;
    icon: string;
    condition: (li: HTMLElement) => boolean;
    callback: (li: HTMLElement) => void;
}

type DocumentDirectory = foundry.applications.sidebar.DocumentDirectory;
type EventArgs = DocumentDirectory | MenuEntry[];

export function registerHooks() {
    const sidebarContextMenuEvent = {
        object: 'foundry.applications.sidebar.DocumentDirectory.prototype',
        property: '_getEntryContextOptions',
    };
    const descriptor = Object.getOwnPropertyDescriptor(
        sidebarContextMenuEvent.object,
        sidebarContextMenuEvent.property,
    );
    if (descriptor) {
        const original = descriptor.value as (...args: unknown[]) => unknown;
        descriptor.value = function (...args: unknown[]) {
            return function (...args: unknown[]) {
                if (
                    args[0] instanceof
                    foundry.applications.sidebar.tabs.JournalDirectory
                ) {
                    insertRenameOption(args[1] as MenuEntry[]);
                }
                return original(...args);
            }.call(this, original.bind(this), [], ...args);
        };
        Object.defineProperty(
            sidebarContextMenuEvent.object,
            sidebarContextMenuEvent.property,
            descriptor,
        );
    }

    // This definitely seems like the new Hook name for it, and would be much more comfortable using this,
    // but fvtt types doesn't recognise this as a valid hook string literal...
    // Hooks.on('getJournalEntrySheetContext', insertRenameOption);
}

// TODO: this could well be pulled out into a generic'ed utility for other document types
function insertRenameOption(menuItems: MenuEntry[]): void {
    menuItems.push({
        name: 'GENERIC.Rename',
        icon: '<i class="fas fa-pen-field fa-fw"></i>',
        condition: (li) => {
            const entry = game.journal.get(li.dataset.documentId ?? '');
            return entry?.canUserModify(game.user, 'update') ?? false;
        },
        callback: async (li) => {
            const journalEntry = game.journal.get(li.dataset.documentId ?? '');
            if (!journalEntry) {
                ui.notifications?.error(
                    'Could not find the journal entry to rename.',
                );
                return;
            }
            const newName = await RenameDirectoryEntryDialog.show({
                documentType: 'Journal Entry',
                originalName: journalEntry.name,
            });
            if (newName) {
                journalEntry.name = newName;
            }
        },
    });
}
