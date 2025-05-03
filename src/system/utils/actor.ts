import { CreatureType } from '@system/types/cosmere';
import { CommonActorData } from '@system/data/actor/common';
import { CosmereActor } from '../documents';

export function getTypeLabel(type: CommonActorData['type']): string {
    // Check if type is a custom type
    const isCustom = type.id === CreatureType.Custom;

    // Get subtype
    const subtype = type.subtype;

    // Get config
    const typeConfig = CONFIG.COSMERE.creatureTypes[type.id];

    // Get primary type label
    const primaryLabel =
        isCustom && type.custom
            ? type.custom
            : game.i18n!.localize(typeConfig.label);

    // Construct type label
    return `${primaryLabel} ${subtype ? `(${subtype})` : ''}`.trim();
}

export async function getActor(actorId: string) {
    return actorId.startsWith('Compendium')
        ? await getActorFromCompendium(actorId)
        : getActorFromCollection(actorId.split('.')[1] ?? '');
}

const getActorFromCollection = (actorId: string) =>
    (game.actors as Actors).get(actorId) as CosmereActor;

const getActorFromCompendium = async (uuid: string) => {
    const components = uuid.split('.');
    const pack = `${components[1]}.${components[2]}`; // Get pack name
    const actorId = components[4] ?? '';

    return (await game.packs
        ?.get(pack)
        ?.getDocument(actorId)) as unknown as CosmereActor;
};
