import type { CharacterActor } from '@system/documents';

export function getCharacterHeaderProps(
    actor: CharacterActor,
    isEditMode: boolean,
    onNameChange: (value: string) => void,
    onLevelChange: (value: number) => void
) {
    const ancestryItem = actor.items.find((item) => item.isAncestry());

    const pathItems = actor.items.filter((item) => item.isPath());

    const uniquePathTypes = pathItems
        .map((item) => item.system.type)
        .filter((value, index, self) => self.indexOf(value) === index);

    return {
        name: actor.name,

        isEditMode,

        ancestryLabel:
            ancestryItem?.name ??
            game.i18n.localize('COSMERE.Item.Type.Ancestry.label'),

        levelLabel:
            game.i18n.localize('COSMERE.Actor.Sheet.Level'),

        pathTypes: uniquePathTypes.map((type) => ({
            type,
            typeLabel: CONFIG.COSMERE.paths.types[type].label,
            paths: pathItems.filter((i) => i.system.type === type),
        })),

        level: actor.system.level,

        onNameChange,
        onLevelChange
    };
}