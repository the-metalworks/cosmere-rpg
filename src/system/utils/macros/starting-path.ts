// Documents
import { CosmereActor } from '@system/documents/actor';
import { CosmereItem, PathItem } from '@system/documents/item';

// Types
import { Skill } from '@system/types/cosmere';

const STARTING_SKILLS: Record<string, Skill> = {
    agent: Skill.Insight,
    envoy: Skill.Discipline,
    hunter: Skill.Perception,
    leader: Skill.Leadership,
    scholar: Skill.Lore,
    warrior: Skill.Athletics,
};

export async function set(
    item: CosmereItem,
    options?: { replace?: boolean; notify?: boolean; ops?: object },
) {
    const actor = item.actor!;

    if (!actor) return;
    if (!item.isPath()) return;

    const paths = actor.paths;

    const changes: object = {};

    // Check if the actor already has a starting path
    const startingPath = paths.find(
        (p) => p.getFlag('cosmere-rpg', 'isStartingPath') === true,
    );
    if (startingPath && options?.replace === true) {
        await unassignStartingPath(startingPath, changes);
    } else if (startingPath) {
        return;
    }

    // Assign the new starting path
    await assignStartingPath(item, changes);

    // Update the actor
    await actor.update(changes, options?.ops);

    if (options?.notify !== false) {
        ui.notifications.info(
            game.i18n!.format('STORMLIGHT.Macro.StartingPath.Set', {
                path: item.name,
                actor: actor.name,
                skill: game.i18n!.localize(
                    `COSMERE.Skill.${STARTING_SKILLS[item.system.id]}`,
                ),
            }),
        );
    }
}

export async function unset(
    item: CosmereItem,
    options?: { replace?: boolean; notify?: boolean; ops?: object },
) {
    const actor = item.actor!;

    if (!item.isPath()) return;

    const isStartingPath = item.getFlag('cosmere-rpg', 'isStartingPath')!;
    if (!isStartingPath) return;

    const changes = {};
    let newStartingPath: PathItem | undefined;

    // Unassign the starting path
    await unassignStartingPath(item, changes, false);

    if (options?.replace !== false) {
        const paths = actor.paths;
        newStartingPath = paths
            .filter((p) => p.system.id !== item.system.id)
            .find(() => true);

        if (newStartingPath) {
            await assignStartingPath(newStartingPath, changes);
        }
    }

    await actor.update(changes, options?.ops);

    if (options?.notify !== false) {
        ui.notifications.info(
            game.i18n!.format(
                newStartingPath
                    ? 'STORMLIGHT.Macro.StartingPath.Replaced'
                    : 'STORMLIGHT.Macro.StartingPath.Unset',
                {
                    actor: actor.name,
                    skill: game.i18n!.localize(
                        `COSMERE.Skill.${STARTING_SKILLS[newStartingPath?.system.id ?? item.system.id]}`,
                    ),
                    oldPath: item.name,
                    newPath: newStartingPath?.name ?? '',
                },
            ),
        );
    }
}

async function assignStartingPath(
    item: PathItem,
    actorChanges: object,
    setFlag = true,
) {
    const actor = item.actor!;
    const skillId = STARTING_SKILLS[item.system.id];

    foundry.utils.mergeObject(
        actorChanges,
        {
            [`system.skills.${skillId}.rank`]:
                actor.system.skills[skillId].rank + 1,
        },
        { inplace: true },
    );

    if (setFlag) await item.setFlag('cosmere-rpg', 'isStartingPath', true);
}

async function unassignStartingPath(
    item: PathItem,
    actorChanges: object,
    setFlag = true,
) {
    const actor = item.actor!;
    if (!actor.isCharacter()) return;

    const skillId = STARTING_SKILLS[item.system.id];

    foundry.utils.mergeObject(
        actorChanges,
        {
            [`system.skills.${skillId}.rank`]:
                actor.system.skills[skillId].rank - 1,
        },
        { inplace: true },
    );

    if (setFlag) await item.unsetFlag('cosmere-rpg', 'isStartingPath');
}

export default {
    set,
    unset,
};
