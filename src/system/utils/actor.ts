import { CreatureType, ExpertiseType } from '@system/types/cosmere';
import { CommonActorData, Expertise } from '@system/data/actor/common';
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

/**
 * Utility function to check if a given expertise is present in a collection of expertises.
 */
export function containsExpertise(
    collection: Collection<Expertise>,
    expertise: Expertise,
): boolean;
export function containsExpertise(
    collection: Collection<Expertise>,
    type: ExpertiseType,
    id: string,
): boolean;
export function containsExpertise(
    collection: Collection<Expertise>,
    ...rest: [Expertise] | [ExpertiseType, string]
): boolean;
export function containsExpertise(
    collection: Collection<Expertise>,
    ...rest: [Expertise] | [ExpertiseType, string]
): boolean {
    const [type, id] = rest.length === 1 ? [rest[0].type, rest[0].id] : rest;
    return collection.has(Expertise.getKey({ type, id }));
}
