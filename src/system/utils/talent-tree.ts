import { CharacterActor } from '@system/documents/actor';
import {
    CosmereItem,
    TalentTreeItem,
    TalentItem,
} from '@system/documents/item';
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

    // Find a managed talent prerequisite
    let talentPrereq = from.prerequisites.find(
        (prereq) =>
            prereq.type === TalentTree.Node.Prerequisite.Type.Talent &&
            prereq.managed,
    );

    if (!talentPrereq) {
        // Generate id
        const id = foundry.utils.randomID();

        // Add item changes
        nodeChanges[`prerequisites.${id}`] = {
            id,
            type: TalentTree.Node.Prerequisite.Type.Talent,
            managed: true,
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

    // Get the connection
    const connection = from.connections.get(to.id);
    if (!connection) return;

    // Get the prereq
    const prereq = from.prerequisites.get(
        connection.prerequisiteId,
    ) as TalentTree.Node.TalentPrerequisite;

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
    tree?: TalentTreeItem,
): boolean {
    return Array.from(prerequisites).every((prereq) =>
        characterMeetsPrerequisiteRule(actor, prereq, tree),
    );
}

export function characterMeetsPrerequisiteRule(
    actor: CharacterActor,
    prereq: TalentTree.Node.Prerequisite,
    tree?: TalentTreeItem,
): boolean {
    switch (prereq.type) {
        case TalentTree.Node.Prerequisite.Type.Talent:
            return Array.from(prereq.talents).some((ref) => {
                // Find talent
                const refTalent = actor.talents.find(
                    (t) => t.system.id === ref.id,
                );
                if (!refTalent) return false;

                // Find the talent in the tree
                const refTalentNode = tree?.system.nodes.find(
                    (node) =>
                        node.type === TalentTree.Node.Type.Talent &&
                        node.talentId === ref.id,
                ) as TalentTree.TalentNode | undefined;
                if (!refTalentNode) return true; // Can't check upstream prerequisites, so assume it's met

                // Check upstream prerequisites
                return characterMeetsTalentPrerequisites(
                    actor,
                    refTalentNode.prerequisites,
                    tree,
                );
            });
        case TalentTree.Node.Prerequisite.Type.Attribute:
            return (
                actor.system.attributes[prereq.attribute].value >= prereq.value
            );
        case TalentTree.Node.Prerequisite.Type.Skill:
            return actor.system.skills[prereq.skill].rank >= prereq.rank;
        case TalentTree.Node.Prerequisite.Type.Level:
            return actor.system.level >= prereq.level;
        case TalentTree.Node.Prerequisite.Type.Ancestry:
            return actor.ancestry?.system.id === prereq.ancestry.id;
        case TalentTree.Node.Prerequisite.Type.Culture:
            return actor.cultures.some(
                (culture) => culture.system.id === prereq.culture.id,
            );
        case TalentTree.Node.Prerequisite.Type.Goal:
            return Array.from(prereq.goals).some((ref) =>
                actor.hasCompletedGoal(ref.id),
            );
        case TalentTree.Node.Prerequisite.Type.Connection:
            return true; // No way to check connections
        default:
            return false;
    }
}

/**
 * Is the talent with the given id currently obtained and
 * required as a prerequisite for any other obtained talent?
 */
export async function isTalentRequiredAsPrerequisite(
    actor: CharacterActor,
    talentId: string,
    tree: TalentTreeItem,
): Promise<boolean> {
    if (!actor.hasTalent(talentId)) return false;

    // Find any talent nodes that have this talent as a prerequisite
    const dependentNodes = tree.system.nodes.filter(
        (node) =>
            node.type === TalentTree.Node.Type.Talent &&
            node.prerequisites.some(
                (prereq) =>
                    prereq.type === TalentTree.Node.Prerequisite.Type.Talent &&
                    prereq.talents.some((t) => t.id === talentId),
            ),
    ) as TalentTree.TalentNode[];

    // Check if any of these nodes are obtained
    const hasDependency = dependentNodes.some((node) =>
        actor.hasTalent(node.talentId),
    );
    if (hasDependency) return true;

    // Get all nested talent tree nodes
    const nestedTreeNodes = tree.system.nodes.filter(
        (node) => node.type === TalentTree.Node.Type.Tree,
    );

    // Resolve all nested talent trees
    const nestedTrees = (
        await Promise.all(
            nestedTreeNodes.map(
                (node) => fromUuid(node.uuid) as Promise<TalentTreeItem | null>,
            ),
        )
    ).filter((tree) => !!tree);

    // Check if any nested trees have the talent as a prerequisite
    for (const nestedTree of nestedTrees) {
        if (await isTalentRequiredAsPrerequisite(actor, talentId, nestedTree)) {
            console.log('Talent is required in nested tree:', nestedTree.id);
            return true;
        }
    }

    // If we reach here, the talent is not required as a prerequisite for any other obtained talent
    return false;
}

/**
 * Get all talents from a talent tree.
 * @param tree The talent tree to get talents from.
 * @param includeNested Whether to include talents from nested trees. Defaults to `true`.
 */
export async function getTalents(
    tree: TalentTreeItem,
    includeNested = true,
): Promise<TalentItem[]> {
    // Get all talents from the nodes
    const talents = (
        await Promise.all(
            tree.system.nodes
                .filter((node) => node.type === TalentTree.Node.Type.Talent)
                .map(async (node) => {
                    const talent = (await fromUuid(
                        node.uuid,
                    )) as TalentItem | null;
                    if (!talent?.isTalent()) return null;

                    return talent;
                }),
        )
    ).filter((v) => !!v);

    // If includeNested is true, get talents from nested trees
    if (includeNested) {
        const nestedTalents = await Promise.all(
            tree.system.nodes
                .filter((node) => node.type === TalentTree.Node.Type.Tree)
                .map(async (node) => {
                    const tree = (await fromUuid(
                        node.uuid,
                    )) as TalentTreeItem | null;
                    if (!tree?.isTalentTree()) return [];

                    return getTalents(tree, true);
                }),
        );
        return talents.concat(...nestedTalents);
    }

    return talents;
}
