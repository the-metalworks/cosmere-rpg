import { SYSTEM_ID } from '../constants';
import { DamageRoll } from '../dice';
import { MESSAGE_TYPES } from '../documents';
import { Attribute, DamageType, Skill } from '../types/cosmere';
import { getActor } from '../utils/actor';

type EnricherTriggerOptions = Record<string, string> & { actorId: string };

Hooks.on('triggerTestEnricher', async (options: EnricherTriggerOptions) => {
    const actor = await getActor(options.actorId ?? '');
    if (actor && options.skill) {
        await actor.rollSkill(
            options.skill as Skill,
            options.attribute
                ? { attribute: options.attribute as Attribute }
                : undefined,
        );
        return;
    }
});

Hooks.on('triggerDamageEnricher', async (options: EnricherTriggerOptions) => {
    const actor = await getActor(options.actorId ?? '');
    if (actor && options.formula) {
        const roll = new DamageRoll(
            String(options.formula),
            actor.getRollData(),
            { damageType: options.damageType as DamageType },
        );
        await roll.evaluate();

        // Create chat message
        const messageConfig = {
            user: game.user!.id,
            speaker: ChatMessage.getSpeaker({ actor }) as ChatSpeakerData,
            rolls: [roll],
            flags: {
                [SYSTEM_ID]: {
                    message: {
                        type: MESSAGE_TYPES.ACTION,
                    },
                },
            },
        };

        await ChatMessage.create(messageConfig);
    }
});
