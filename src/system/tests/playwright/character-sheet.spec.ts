import {
    ActorType,
    Attribute,
    AttributeGroup,
} from '@src/system/types/cosmere';
import { test, expect } from './fixtures';
import {
    checkActorAttribute,
    checkActorDefense,
    checkActorResource,
    createNewActor,
    getActorSheet,
    updateActorAttribute,
    updateActorResource,
} from './helpers/actor';

test('Character Details Tab Interactions', async ({
    authenticatedPage: page,
    createActor,
}) => {
    const testCharacter = await createActor(
        'Test Character',
        ActorType.Character,
    );
    const testCharacterSheet = await getActorSheet(page, testCharacter);
    await checkActorResource(testCharacterSheet, 'Health', 0, 10);
    await checkActorResource(testCharacterSheet, 'Focus', 0, 2);
    await checkActorResource(testCharacterSheet, 'Investiture', 0, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Strength, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Speed, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Intellect, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Willpower, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Awareness, 0);
    await checkActorAttribute(testCharacterSheet, Attribute.Presence, 0);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Physical, 10);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Cognitive, 10);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Spiritual, 10);

    // Update strength, check new values
    await updateActorAttribute(testCharacterSheet, Attribute.Strength, 1);
    await checkActorResource(testCharacterSheet, 'Health', 1, 11);
    await checkActorResource(testCharacterSheet, 'Focus', 0, 2);
    await checkActorAttribute(testCharacterSheet, Attribute.Strength, 1);
    await checkActorAttribute(testCharacterSheet, Attribute.Speed, 0);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Physical, 11);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Cognitive, 10);

    // Update speed, check new values
    await updateActorAttribute(testCharacterSheet, Attribute.Speed, 2);
    await checkActorResource(testCharacterSheet, 'Health', 1, 11);
    await checkActorResource(testCharacterSheet, 'Focus', 0, 2);
    await checkActorAttribute(testCharacterSheet, Attribute.Strength, 1);
    await checkActorAttribute(testCharacterSheet, Attribute.Speed, 2);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Physical, 13);
    await checkActorDefense(testCharacterSheet, AttributeGroup.Cognitive, 10);

    // Update health to less than max
    await updateActorResource(testCharacterSheet, 'Health', 5);
    await checkActorResource(testCharacterSheet, 'Health', 5, 11);

    // Update health to more than max
    await updateActorResource(testCharacterSheet, 'Health', 100);
    await checkActorResource(testCharacterSheet, 'Health', 11, 11);
});
