// Dialog
import { Expertise } from '@src/system/data/actor/common';
import { EruditionDialog } from './dialog';

// Types
import { EruditionConfig, EruditionSelections, PickedExpertise } from './types';
import { CosmereActor } from '@src/system/documents';
import {
    AttributeGroup,
    ExpertiseType,
    Skill,
} from '@src/system/types/cosmere';

// Constants
import { SYSTEM_ID } from '@system/constants';

// Define constants for flag keys
export const FLAGS = {
    SKILLS_COUNT: 'talent.erudition.skills.count',
    SKILLS_GROUPS: 'talent.erudition.skills.groups',
    SKILLS_INCREASE: 'talent.erudition.skills.increase',
    SKILLS_SELECTED: 'talent.erudition.skills.selected',
    EXPERTISES_COUNT: 'talent.erudition.expertises.count',
    EXPERTISES_TYPES: 'talent.erudition.expertises.types',
    EXPERTISES_SELECTED: 'talent.erudition.expertises.selected',
} as const;

const DEFAULT_SKILLS_COUNT = 2;
const DEFAULT_SKILLS_ATTRIBUTE_GROUPS = ['cog'] as AttributeGroup[];
const DEFAULT_SKILLS_INCREASE = 1; // Default increase for skills
const DEFAULT_EXPERTISES_COUNT = 1;
const DEFAULT_EXPERTISES_TYPES = ['cultural', 'utility'] as ExpertiseType[];

/**
 * Applies the effects of a long rest for the Erudition talent.
 */
export async function choose(actor: CosmereActor) {
    const result = await EruditionDialog.show({
        actor,
        config: getConfig(actor),
        selected: getSelections(actor),
    });
    if (!result) return;

    // Clear current selections
    await clearSelections(actor);

    // Select the skills
    for (const skillId of result.skills) {
        await selectSkill(actor, skillId);
    }

    // Select the expertises
    for (const exp of result.expertises) {
        const expertise = new Expertise({
            id: exp.id,
            type: exp.type,
            label: exp.label,
        });
        await selectExpertise(actor, expertise, exp.label);
    }
}

export async function clear(actor: CosmereActor) {
    // Clear all selections
    await clearSelections(actor);
}

/**
 * Validates the state of the Erudition talent.
 */
export async function validate(actor: CosmereActor) {
    // Get the Erudition configuration
    const config: EruditionConfig = getConfig(actor);

    // Get the valid skills based on the flags
    const validSkills = getValidSkills(actor);

    // Get selections
    const selections = getSelections(actor);

    // Find all selected skills that are no longer valid
    const invalidSkills = selections.skills.filter(
        (skillId) => !validSkills.includes(skillId),
    );

    // Deselect invalid skills
    for (const skillId of invalidSkills) {
        await deselectSkill(actor, skillId);
    }

    // Check if the number of selected skills exceeds the allowed count
    if (selections.skills.length > config.skills.count) {
        const excessCount = selections.skills.length - config.skills.count;
        const skillsToDeselect = selections.skills.slice(-excessCount);

        // Deselect the excess skills
        for (const skillId of skillsToDeselect) {
            await deselectSkill(actor, skillId);
        }
    }

    // Find all selected expertises that are no longer valid
    const invalidExpertises = selections.expertises.filter(
        (expertiseId) => !config.expertises.types.includes(expertiseId.type),
    );

    // Deselect invalid expertises
    for (const expId of invalidExpertises) {
        await deselectExpertise(actor, expId);
    }

    // Check if the number of selected expertises exceeds the allowed count
    if (selections.expertises.length > config.expertises.count) {
        const excessCount =
            selections.expertises.length - config.expertises.count;
        const expertisesToDeselect = selections.expertises.slice(-excessCount);

        // Deselect the excess expertises
        for (const expId of expertisesToDeselect) {
            await deselectExpertise(actor, expId);
        }
    }
}

export async function modifySkillsCount(actor: CosmereActor, amount: number) {
    const currentCount =
        actor.getFlag(SYSTEM_ID, FLAGS.SKILLS_COUNT) ?? DEFAULT_SKILLS_COUNT;
    await actor.setFlag(SYSTEM_ID, FLAGS.SKILLS_COUNT, currentCount + amount);

    // Validate the selections after modifying the count
    await validate(actor);
}

export async function modifyExpertisesCount(
    actor: CosmereActor,
    amount: number,
) {
    const currentCount =
        actor.getFlag(SYSTEM_ID, FLAGS.EXPERTISES_COUNT) ??
        DEFAULT_EXPERTISES_COUNT;
    await actor.setFlag(
        SYSTEM_ID,
        FLAGS.EXPERTISES_COUNT,
        currentCount + amount,
    );

    // Validate the selections after modifying the count
    await validate(actor);
}

export async function addSkillsAttributeGroup(
    actor: CosmereActor,
    key: AttributeGroup,
) {
    const currentGroups =
        actor.getFlag(SYSTEM_ID, FLAGS.SKILLS_GROUPS) ||
        DEFAULT_SKILLS_ATTRIBUTE_GROUPS;
    if (!currentGroups.includes(key)) {
        await actor.setFlag(SYSTEM_ID, FLAGS.SKILLS_GROUPS, [
            ...currentGroups,
            key,
        ]);
    }

    // Validate the selections after modifying the groups
    await validate(actor);
}

export async function removeSkillsAttributeGroup(
    actor: CosmereActor,
    key: AttributeGroup,
) {
    const currentGroups: AttributeGroup[] =
        actor.getFlag(SYSTEM_ID, FLAGS.SKILLS_GROUPS) ||
        DEFAULT_SKILLS_ATTRIBUTE_GROUPS;
    if (currentGroups.includes(key)) {
        await actor.setFlag(
            SYSTEM_ID,
            FLAGS.SKILLS_GROUPS,
            currentGroups.filter((g) => g !== key),
        );
    }

    // Validate the selections after modifying the groups
    await validate(actor);
}

export async function addExpertisesType(
    actor: CosmereActor,
    type: ExpertiseType,
) {
    const currentTypes =
        actor.getFlag(SYSTEM_ID, FLAGS.EXPERTISES_TYPES) ||
        DEFAULT_EXPERTISES_TYPES;
    if (!currentTypes.includes(type)) {
        await actor.setFlag(SYSTEM_ID, FLAGS.EXPERTISES_TYPES, [
            ...currentTypes,
            type,
        ]);
    }

    // Validate the selections after modifying the types
    await validate(actor);
}

export async function removeExpertisesType(
    actor: CosmereActor,
    type: ExpertiseType,
) {
    const currentTypes: ExpertiseType[] =
        actor.getFlag(SYSTEM_ID, FLAGS.EXPERTISES_TYPES) ||
        DEFAULT_EXPERTISES_TYPES;
    if (currentTypes.includes(type)) {
        await actor.setFlag(
            SYSTEM_ID,
            FLAGS.EXPERTISES_TYPES,
            currentTypes.filter((t) => t !== type),
        );
    }

    // Validate the selections after modifying the types
    await validate(actor);
}

/* --- Helpers --- */

/**
 * Utility function to get the Erudition configuration for the actor flags
 */
function getConfig(actor: CosmereActor): EruditionConfig {
    return {
        skills: {
            count:
                actor.getFlag(SYSTEM_ID, FLAGS.SKILLS_COUNT) ??
                DEFAULT_SKILLS_COUNT,
            groups:
                actor.getFlag(SYSTEM_ID, FLAGS.SKILLS_GROUPS) ||
                DEFAULT_SKILLS_ATTRIBUTE_GROUPS,
        },
        expertises: {
            count:
                actor.getFlag(SYSTEM_ID, FLAGS.EXPERTISES_COUNT) ??
                DEFAULT_EXPERTISES_COUNT,
            types:
                actor.getFlag(SYSTEM_ID, FLAGS.EXPERTISES_TYPES) ||
                DEFAULT_EXPERTISES_TYPES,
        },
    };
}

function getValidSkills(actor: CosmereActor): string[] {
    const attributeGroups: string[] =
        actor.getFlag(SYSTEM_ID, FLAGS.SKILLS_GROUPS) ||
        DEFAULT_SKILLS_ATTRIBUTE_GROUPS;
    return Object.values(CONFIG.COSMERE.attributeGroups)
        .filter((group) => attributeGroups.includes(group.key))
        .flatMap((group) => group.attributes)
        .flatMap(
            (attrId) => CONFIG.COSMERE.attributes[attrId].skills,
        ) as string[];
}

/**
 * Utility function to get the selections of skills and expertises for the Erudition talent.
 */
function getSelections(actor: CosmereActor): EruditionSelections {
    return {
        skills: actor.getFlag(SYSTEM_ID, FLAGS.SKILLS_SELECTED) || [],
        expertises: actor.getFlag(SYSTEM_ID, FLAGS.EXPERTISES_SELECTED) || [],
    };
}

async function clearSelections(actor: CosmereActor) {
    // Get current selections
    const selections = getSelections(actor);

    // Clear skills and expertises selections
    for (const skillId of selections.skills) {
        await deselectSkill(actor, skillId);
    }

    for (const expertiseId of selections.expertises) {
        await deselectExpertise(actor, expertiseId);
    }
}

function selectSkill(actor: CosmereActor, skillId: Skill) {
    // Get current selections
    const selections = getSelections(actor);

    // Get amount to increase by
    const increaseAmount =
        actor.getFlag(SYSTEM_ID, FLAGS.SKILLS_INCREASE) ||
        DEFAULT_SKILLS_INCREASE;

    return actor.update({
        [`flags.${SYSTEM_ID}.${FLAGS.SKILLS_SELECTED}`]: [
            ...selections.skills,
            skillId,
        ],
        [`flags.${SYSTEM_ID}.skills.${skillId}.temporaryRanks`]: increaseAmount,
        [`system.skills.${skillId}.rank`]:
            actor.system.skills[skillId].rank + increaseAmount,
    });
}

function deselectSkill(actor: CosmereActor, skillId: Skill) {
    // Get current selections
    const selections = getSelections(actor);

    // Ensure the skill is in selections
    if (!selections.skills.includes(skillId)) return Promise.resolve();

    // Remove the skill from selections
    const updatedSkills = selections.skills.filter((id) => id !== skillId);

    // Get the amount of temporary ranks to reset
    const temporaryRanks =
        actor.getFlag(SYSTEM_ID, `skills.${skillId}.temporaryRanks`) || 0;

    // Update actor with new selections
    return actor.update({
        [`flags.${SYSTEM_ID}.${FLAGS.SKILLS_SELECTED}`]: updatedSkills,
        [`flags.${SYSTEM_ID}.skills.${skillId}.temporaryRanks`]: 0,
        [`system.skills.${skillId}.rank`]:
            actor.system.skills[skillId].rank - temporaryRanks,
    });
}

function selectExpertise(
    actor: CosmereActor,
    compositeId: Expertise,
    label?: string,
) {
    // Get current selections
    const selections = getSelections(actor);

    // Split composite ID into type and id
    const [type, id] = [compositeId.type, compositeId.id];

    // Ensure the expertise is not already selected
    if (selections.expertises.find((exp) => exp.key === compositeId.key))
        return Promise.resolve();

    // Update actor with new selections
    return actor.update({
        [`flags.${SYSTEM_ID}.${FLAGS.EXPERTISES_SELECTED}`]: [
            ...selections.expertises,
            compositeId,
        ],
        [`system.expertises.${compositeId.key}`]: {
            id,
            type,
            label,
            locked: true,
        },
    });
}

function deselectExpertise(actor: CosmereActor, compositeId: Expertise) {
    // Get current selections
    const selections = getSelections(actor);

    const [type, id] = [compositeId.type, compositeId.id];

    // Ensure the expertise is in selections
    // the key is undefined here for some reason, but comparing the id/type works
    if (
        !selections.expertises.find((exp) => exp.id === id && exp.type === type)
    )
        return Promise.resolve();

    // Remove the expertise from selections
    const updatedExpertises = selections.expertises.filter(
        (exp) => exp.id !== id && exp.type !== type,
    );

    // Update actor with new selections
    return actor.update({
        [`flags.${SYSTEM_ID}.${FLAGS.EXPERTISES_SELECTED}`]: updatedExpertises,
        // gotta manually construct the key since it is undefined for some reason
        [`system.expertises.-=${type}:${id}`]: {},
    });
}
