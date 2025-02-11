import { CharacterActor } from '@system/documents/actor';
import { CosmereItem, TalentTreeItem } from '@system/documents/item';
import { TalentTree, Talent } from '@system/types/item';

/**
 * Utility function to add a node to the talent tree.
 */
export function addNode(
    node: Omit<TalentTree.Node, 'connections'>,
    tree: TalentTreeItem,
    operation?: Partial<
        Omit<foundry.abstract.DatabaseUpdateOperation, 'updates' | '_result'>
    >,
) {
    return tree.update(
        {
            [`system.nodes.${node.id}`]: node,
        },
        operation,
    );
}

/**
 * Utility function to remove a node from the talent tree.
 * Automatically manages connections to other nodes.
 */
export async function removeNode(
    node: TalentTree.Node,
    tree: TalentTreeItem,
    operation?: Partial<
        Omit<foundry.abstract.DatabaseUpdateOperation, 'updates' | '_result'>
    >,
) {
    // Get all connections TO the removed node (if relevant)
    const connections = tree.system.nodes
        .filter((n) => n.type === TalentTree.Node.Type.Talent)
        .filter((n) => n.connections.some((c) => c.id === node.id))
        .map((n) => n.id);

    // Remove connections
    for (const connection of connections) {
        await removeConnection(connection, node.id, tree, operation);
    }

    return tree.update(
        {
            [`system.nodes.-=${node.id}`]: null,
        },
        operation,
    );
}

export function addConnection(
    fromId: string,
    toId: string,
    tree: TalentTreeItem,
    operation?: Partial<
        Omit<foundry.abstract.DatabaseUpdateOperation, 'updates' | '_result'>
    >,
) {
    // Get the nodes
    const from = tree.system.nodes.find((node) => node.id === fromId);
    const to = tree.system.nodes.find((node) => node.id === toId);

    if (!from || from.type !== TalentTree.Node.Type.Talent)
        throw new Error(
            `Failed to add connection: Invalid from node ${fromId}`,
        );
    if (!to || to.type !== TalentTree.Node.Type.Talent)
        throw new Error(`Failed to add connection: Invalid to node ${toId}`);

    // Ensure there isn't already a connection
    if (from.connections.some((connection) => connection.id === to.id))
        return tree;

    const nodeChanges = {} as Record<string, unknown>;

    // Find a talent prerequisite
    let talentPrereq = from.prerequisites.find(
        (prereq) => prereq.type === TalentTree.Node.Prerequisite.Type.Talent,
    );

    if (!talentPrereq) {
        // Generate id
        const id = foundry.utils.randomID();

        // Add item changes
        nodeChanges[`prerequisites.${id}`] = {
            id,
            type: TalentTree.Node.Prerequisite.Type.Talent,
            talents: {
                [to.talentId]: {
                    uuid: to.uuid,
                    id: to.talentId,
                    label: (fromUuidSync(to.uuid) as Pick<CosmereItem, 'name'>)
                        .name,
                },
            },
        };

        // Set talentPrereq
        talentPrereq = nodeChanges[
            `prerequisites.${id}`
        ] as TalentTree.Node.TalentPrerequisite;
    } else {
        // Add item changes
        nodeChanges[`prerequisites.${talentPrereq.id}.talents.${to.talentId}`] =
            {
                uuid: to.uuid,
                id: to.talentId,
                label: (fromUuidSync(to.uuid) as Pick<CosmereItem, 'name'>)
                    .name,
            };
    }

    // Add connection
    nodeChanges[`connections.${to.id}`] = {
        id: to.id,
        prerequisiteId: talentPrereq.id,
    };

    // Update the tree
    return tree.update(
        {
            [`system.nodes.${from.id}`]: nodeChanges,
        },
        operation,
    );
}

export function removeConnection(
    fromId: string,
    toId: string,
    tree: TalentTreeItem,
    operation?: Partial<
        Omit<foundry.abstract.DatabaseUpdateOperation, 'updates' | '_result'>
    >,
) {
    // Get the nodes
    const from = tree.system.nodes.find((node) => node.id === fromId);
    const to = tree.system.nodes.find((node) => node.id === toId);

    if (!from || from.type !== TalentTree.Node.Type.Talent)
        throw new Error(
            `Failed to remove connection: Invalid from node ${fromId}`,
        );
    if (!to || to.type !== TalentTree.Node.Type.Talent)
        throw new Error(`Failed to remove connection: Invalid to node ${toId}`);

    // Find the prerequisite that connects the two nodes
    const prereq = from.prerequisites.find(
        (prereq) =>
            prereq.type === TalentTree.Node.Prerequisite.Type.Talent &&
            prereq.talents.some((talent) => talent.id === to.talentId),
    ) as TalentTree.Node.TalentPrerequisite | undefined;

    // if (!prereq)
    //     throw new Error(`Failed to remove connection: No prerequisite found between ${fromId} and ${toId}`);

    // Prepare node changes
    const nodeChanges = prereq
        ? Array.from(prereq.talents).length === 1
            ? { [`prerequisites.-=${prereq.id}`]: {} }
            : {
                  [`prerequisites.${prereq.id}.talents`]: prereq.talents.filter(
                      (talent) => talent.id !== to.talentId,
                  ),
              }
        : {};

    // Remove the connection
    nodeChanges[`connections.-=${to.id}`] = {};

    // Update the tree
    return tree.update(
        {
            [`system.nodes.${from.id}`]: nodeChanges,
        },
        operation,
    );
}

/**
 * Utility function to remove a prerequisite from a node.
 * Automatically manages connections to other nodes.
 */
export function removePrerequisite(
    node: TalentTree.TalentNode,
    prereqId: string,
    tree: TalentTreeItem,
    operation?: Partial<
        Omit<foundry.abstract.DatabaseUpdateOperation, 'updates' | '_result'>
    >,
) {
    // Get the prerequisite
    const prereq = node.prerequisites.get(prereqId);
    if (!prereq)
        throw new Error(
            `Failed to remove prerequisite: No prerequisite found with id ${prereqId}`,
        );

    // Find all connections that depend on this prerequisite
    const connections = node.connections
        .filter((connection) => connection.prerequisiteId === prereqId)
        .map((connection) => connection.id);

    // Update the tree
    return tree.update(
        {
            [`system.nodes.${node.id}`]: {
                [`prerequisites.-=${prereqId}`]: {},
                ...connections.reduce(
                    (acc, id) => ({
                        ...acc,
                        [`connections.-=${id}`]: {},
                    }),
                    {} as Record<string, unknown>,
                ),
            },
        },
        operation,
    );
}

export function characterMeetsTalentPrerequisites(
    actor: CharacterActor,
    prerequisites: Collection<TalentTree.Node.Prerequisite>,
) {
    return Array.from(prerequisites).every((prereq) =>
        characterMeetsPrerequisiteRule(actor, prereq),
    );
}

export function characterMeetsPrerequisiteRule(
    actor: CharacterActor,
    prereq: TalentTree.Node.Prerequisite,
) {
    switch (prereq.type) {
        case TalentTree.Node.Prerequisite.Type.Talent:
            return Array.from(prereq.talents).every((ref) =>
                actor.hasTalent(ref.id),
            );
        case TalentTree.Node.Prerequisite.Type.Attribute:
            return (
                actor.system.attributes[prereq.attribute].value >= prereq.value
            );
        case TalentTree.Node.Prerequisite.Type.Skill:
            return actor.system.skills[prereq.skill].rank >= prereq.rank;
        case TalentTree.Node.Prerequisite.Type.Level:
            return true; // TODO
        case TalentTree.Node.Prerequisite.Type.Connection:
            return true; // No way to check connections
        default:
            return false;
    }
}
