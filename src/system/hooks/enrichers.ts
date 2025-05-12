import { SYSTEM_ID } from '../constants';
import { DamageRoll } from '../dice';
import { MESSAGE_TYPES } from '../documents';
import { Attribute, DamageType, Skill } from '../types/cosmere';
import { CosmereHooks } from '../types/hooks';
import { getActor } from '../utils/actor';

Hooks.on<CosmereHooks.EnricherTrigger>(
    'triggerTestEnricher',
    async (actorId: string, source: string, data: Record<string, string>) => {
        const actor = await getActor(actorId ?? '');
        if (actor && data.skill) {
            await actor.rollSkill(
                data.skill as Skill,
                data.attribute
                    ? { attribute: data.attribute as Attribute }
                    : undefined,
            );
            return;
        }
    },
);

Hooks.on<CosmereHooks.EnricherTrigger>(
    'triggerDamageEnricher',
    async (actorId: string, source: string, data: Record<string, string>) => {
        const actor = await getActor(actorId ?? '');
        if (actor && data.formula) {
            const roll = new DamageRoll(
                String(data.formula),
                actor.getRollData(),
                { damageType: data.damageType as DamageType },
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
    },
);
