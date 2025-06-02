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

export async function getActor(uuid: string) {
    const { collection, documentId, id, type } = foundry.utils.parseUuid(uuid);

    const document =
        collection instanceof CompendiumCollection
            ? ((await collection.getDocument(documentId!)) as CosmereActor)
            : (collection!.get(documentId!) as Scene | CosmereActor);

    return document instanceof Scene
        ? (document.tokens.get(uuid.split('.')[3])!.actor as CosmereActor)
        : document;
}

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
