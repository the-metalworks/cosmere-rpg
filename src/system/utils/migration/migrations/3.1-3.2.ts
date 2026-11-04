import { ItemType } from '@system/types/cosmere';
import type {
    RawDocumentData,
    RawActorData,
    AnyMutableObject,
} from '@src/system/types/utils';
import { Node } from '@src/system/types/item/talent-tree';

// Data
import { TalentTreeItemDataModel } from '@src/system/data/item';

// Utils
import {
    fixInvalidDocument,
    getPossiblyInvalidDocument,
    getRawDocumentSources,
} from '@system/utils/data';
import { handleDocumentMigrationError } from '../utils';

// Logging
import { Logger } from '@system/utils/logger';

let logger: Logger;

export default {
    from: '3.1',
    to: '3.2',
    execute: async (packId?: string) => {
        logger ??= new Logger('migration');

        const compendium = packId ? game.packs?.get(packId) : undefined;

        if (!compendium || compendium.documentName === 'Item') {
            const items = await getRawDocumentSources('Item', packId);
            await migrateGlobalItems(items, compendium);
        }

        if (!compendium || compendium.documentName === 'Actor') {
            const actors = await getRawDocumentSources<RawActorData>(
                'Actor',
                packId,
            );
            await migrateGlobalActors(actors, compendium);
        }
    },
};

async function migrateGlobalItems(
    items: RawDocumentData[],
    compendium?: CompendiumCollection.Any,
) {
    for (const item of items) {
        const document = await getPossiblyInvalidDocument<Item.Implementation>(
            'Item',
            item._id,
            compendium,
        );

        if (item.type === ItemType.TalentTree)
            await migrateTalentTree(
                item as unknown as RawDocumentData<TalentTreeItemDataModel>,
                document,
            );
    }
}

async function migrateGlobalActors(
    actors: RawActorData[],
    compendium?: CompendiumCollection.Any,
) {
    for (const data of actors) {
        logger.debug('Migrating actor', { raw: data });
        try {
            if (data.items.length === 0) continue;

            const actor =
                await getPossiblyInvalidDocument<Actor.Implementation>(
                    'Actor',
                    data._id,
                    compendium,
                );

            for (const itemData of data.items) {
                const item = actor.items.get(itemData._id, {
                    invalid: true,
                    strict: true,
                }) as Item.Implementation;

                if (itemData.type === ItemType.TalentTree) {
                    await migrateTalentTree(itemData, item);
                }
            }
        } catch (err: unknown) {
            handleDocumentMigrationError(err, 'Actor', data);
        }
    }
}

async function migrateTalentTree(
    data: RawDocumentData<TalentTreeItemDataModel>,
    document: Item.Implementation,
) {
    try {
        logger.debug('Migrating item', { raw: data });
        let changes = {};
        for (const oldNode of Object.values(data.system.nodes)) {
            if (oldNode.type == Node.Type.Talent) {
                //Don't do anything to nodes which don't have prerequisites
                if (!oldNode.prerequisites) continue;

                for (const oldPrereq of Object.values(oldNode.prerequisites)) {
                    const newPrereq = getNewPrereqEquivalent(oldPrereq);

                    // If we don't need to change the prereq, don't add it to the changes
                    if (!newPrereq) continue;
                    const newChange = {
                        system: {
                            nodes: {
                                [oldNode.id]: {
                                    [`prerequisites.==${(oldPrereq as Node.Prerequisite).id}`]:
                                        newPrereq,
                                },
                            },
                        },
                    };
                    changes = foundry.utils.mergeObject(changes, newChange, {
                        recursive: true,
                    });
                }
            }
        }
        await document.update(changes);
    } catch (err: unknown) {
        handleDocumentMigrationError(err, 'Item', data);
    }
}

// NOTE: Use any here as we're dealing with old raw talent tree prereq data
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment*/
function getNewPrereqEquivalent(prereq: Node.Prerequisite) {
    switch (prereq.type) {
        case Node.Prerequisite.Type.Ancestry: {
            const newPrereq: Node.AncestryPrerequisite = {
                id: prereq.id,
                type: prereq.type,
                managed: prereq.managed,
                ancestries: new Collection<Node.Prerequisite.ItemRef>(),
            };
            const item = (prereq as any).ancestry as Node.Prerequisite.ItemRef;
            newPrereq.ancestries.set(item.id, {
                id: item.id,
                uuid: item.uuid,
                label: item.label,
            });
            return newPrereq;
        }

        case Node.Prerequisite.Type.Culture: {
            const newPrereq: Node.CulturePrerequisite = {
                id: prereq.id,
                type: prereq.type,
                managed: prereq.managed,
                cultures: new Collection<Node.Prerequisite.ItemRef>(),
            };
            const item = (prereq as any).culture as Node.Prerequisite.ItemRef;
            newPrereq.cultures.set(item.id, {
                id: item.id,
                uuid: item.uuid,
                label: item.label,
            });
            return newPrereq;
        }

        case Node.Prerequisite.Type.Power: {
            const newPrereq: Node.PowerPrerequisite = {
                id: prereq.id,
                type: prereq.type,
                managed: prereq.managed,
                powers: new Collection<Node.Prerequisite.ItemRef>(),
            };
            const item = (prereq as any).power as Node.Prerequisite.ItemRef;
            newPrereq.powers.set(item.id, {
                id: item.id,
                uuid: item.uuid,
                label: item.label,
            });
            return newPrereq;
        }

        case Node.Prerequisite.Type.Attribute: {
            const newPrereq: Node.AttributePrerequisite = {
                id: prereq.id,
                type: prereq.type,
                managed: prereq.managed,
                attributes: [
                    {
                        key: (prereq as any).attribute,
                        value: (prereq as any).value,
                    },
                ],
            };
            return newPrereq;
        }

        case Node.Prerequisite.Type.Skill: {
            const newPrereq: Node.SkillPrerequisite = {
                id: prereq.id,
                type: prereq.type,
                managed: prereq.managed,
                skills: [
                    {
                        key: (prereq as any).skill,
                        value: (prereq as any).rank,
                    },
                ],
            };
            return newPrereq;
        }
    }
}
