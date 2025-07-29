interface DropData {
    type: string;
    uuid: string;
}

const VALID_DOCUMENT_TYPES = [CONFIG.Item.documentClass.metadata.name];

Hooks.on('hotbarDrop', (bar, data: DropData, slot) => {
    if (VALID_DOCUMENT_TYPES.includes(data.type)) {
        void createCosmereMacro(data, slot);
        // We block the default drop behaviour if the type is supported
        return false;
    }
});

/* --- Helpers --- */

async function createCosmereMacro(data: DropData, slot: number) {
    const macroData = { type: 'script', scope: 'actor' } as MacroData;

    let itemData;

    switch (data.type) {
        case CONFIG.Item.documentClass.metadata.name:
            itemData = (await Item.fromDropData(data)) as Item;

            if (!itemData) return;

            foundry.utils.mergeObject(macroData, {
                name: itemData.name,
                img: itemData.img,
                command: `(await fromUuid("${itemData.uuid}")).use();`,
            });
            break;
        default:
            return;
    }

    // Assign the macro to the hotbar
    const macro =
        (game.macros as foundry.documents.BaseMacro[]).find(
            (m) => m.name === macroData.name && m.command === macroData.command,
        ) ?? (await foundry.documents.BaseMacro.create(macroData));

    await game.user?.assignHotbarMacro(macro, slot);
}
