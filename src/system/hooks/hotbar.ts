interface DropData {
    type: string;
    uuid: string;
}

const VALID_DOCUMENT_TYPES = [(CONFIG.Item.documentClass as unknown as typeof Item).metadata.name] as string[];

Hooks.on('hotbarDrop', ((_: unknown, data: DropData, slot: number) => {
    if (VALID_DOCUMENT_TYPES.includes(data.type)) {
        void createCosmereMacro(data, slot);
        // We block the default drop behaviour if the type is supported
        return false;
    }
}) as any); // TEMP: Workaround

/* --- Helpers --- */

async function createCosmereMacro(data: DropData, slot: number) {
    const macroData = { type: 'script', scope: 'actor' } as Macro.CreateData;

    let itemData;

    switch (data.type) {
        case (CONFIG.Item.documentClass as unknown as typeof Item).metadata.name:
            itemData = await Item.fromDropData(data);

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
        game.macros.find(
            (m) => m.name === macroData.name && m.command === macroData.command,
        ) ?? (await Macro.create(macroData))!;

    await game.user?.assignHotbarMacro(macro, slot);
}