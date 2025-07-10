import { RelationshipsItem } from '@system/documents/item';
import {
    ItemRelationship,
    ItemRelationshipData,
} from '@system/data/item/mixins/relationships';

// Constants
import { SYSTEM_ID } from '@system/constants';

function createRelationshipData(
    to: RelationshipsItem,
    type: ItemRelationship.Type,
    removalPolicy?: ItemRelationship.RemovalPolicy,
    id = foundry.utils.randomID(),
): ItemRelationshipData {
    return {
        id,
        type,
        itemType: to.type,
        uuid: to.uuid,
        removalPolicy,
    };
}

function addRelationship(
    from: RelationshipsItem,
    to: RelationshipsItem,
    type: ItemRelationship.Type,
    removalPolicy?: ItemRelationship.RemovalPolicy,
    source?: false,
): Promise<void>;
function addRelationship(
    from: RelationshipsItem,
    to: RelationshipsItem,
    type: ItemRelationship.Type,
    removalPolicy: ItemRelationship.RemovalPolicy | undefined,
    source: true,
): void;
function addRelationship(
    from: RelationshipsItem,
    to: RelationshipsItem,
    type: ItemRelationship.Type,
    removalPolicy?: ItemRelationship.RemovalPolicy,
    source?: boolean,
): Promise<void> | void;
function addRelationship(
    from: RelationshipsItem,
    to: RelationshipsItem,
    type: ItemRelationship.Type,
    removalPolicy?: ItemRelationship.RemovalPolicy,
    source = false,
): Promise<void> | void {
    // Ensure the item is not already related
    if (from.isRelatedTo(to, type)) return;

    return setRelationship(
        foundry.utils.randomID(),
        from,
        to,
        type,
        removalPolicy,
        source,
    );
}

function addRelationshipData(
    itemData: object,
    to: RelationshipsItem,
    type: ItemRelationship.Type,
): object {
    return setRelationshipData(foundry.utils.randomID(), itemData, to, type);
}

function setRelationship(
    id: string,
    from: RelationshipsItem,
    to: RelationshipsItem,
    type: ItemRelationship.Type,
    removalPolicy?: ItemRelationship.RemovalPolicy,
    source?: false,
): Promise<void>;
function setRelationship(
    id: string,
    from: RelationshipsItem,
    to: RelationshipsItem,
    type: ItemRelationship.Type,
    removalPolicy: ItemRelationship.RemovalPolicy | undefined,
    source: true,
): void;
function setRelationship(
    id: string,
    from: RelationshipsItem,
    to: RelationshipsItem,
    type: ItemRelationship.Type,
    removalPolicy?: ItemRelationship.RemovalPolicy,
    source?: boolean,
): Promise<void> | void;
function setRelationship(
    id: string,
    from: RelationshipsItem,
    to: RelationshipsItem,
    type: ItemRelationship.Type,
    removalPolicy?: ItemRelationship.RemovalPolicy,
    source = false,
): Promise<void> | void {
    // Ensure the item is not already related
    if (from.system.relationships.some((rel) => rel.id === id)) return;
    const changes = setRelationshipData(id, {}, to, type, removalPolicy);

    if (!source) {
        return from.update(changes).then(void 0);
    } else {
        from.updateSource(changes);
    }
}

function setRelationshipData(
    id: string,
    itemData: object,
    to: RelationshipsItem,
    type: ItemRelationship.Type,
    removalPolicy?: ItemRelationship.RemovalPolicy,
): object {
    const rel = createRelationshipData(to, type, removalPolicy, id);
    return foundry.utils.mergeObject(itemData, {
        [`system.relationships.${rel.id}`]: rel,
        ...(type === ItemRelationship.Type.Parent && to.hasId()
            ? {
                  [`flags.${SYSTEM_ID}.meta.origin`]: {
                      type: to.type,
                      id: to.system.id,
                  },
              }
            : {}),
    });
}

export interface RemoveRelationshipOptions {
    relType?: ItemRelationship.Type;
    source?: boolean;
}

function removeRelationship(
    from: RelationshipsItem,
    to: RelationshipsItem,
    options: RemoveRelationshipOptions = {},
): Promise<void> | void {
    const relationship = from.system.relationships.find(
        (rel) =>
            (rel.type === options.relType || !options.relType) &&
            rel.uuid === to.uuid,
    );
    if (relationship) {
        const changes = {
            [`system.relationships.-=${relationship.id}`]: {
                type: relationship.type,
            },
        };

        if (!options.source) {
            return from.update(changes).then(void 0);
        } else {
            from.updateSource(changes);
        }
    }
}

export default {
    addRelationship,
    removeRelationship,
    setRelationship,
    createRelationshipData,
    addRelationshipData,
    setRelationshipData,
};
