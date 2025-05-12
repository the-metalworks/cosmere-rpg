import { DamageRoll } from '../dice';
import { MESSAGE_TYPES } from '../documents';
import { Attribute, DamageType, Skill } from '../types/cosmere';
import { getActor } from '../utils/actor';

// Hooks
import { CosmereHooks } from '@system/hooks';

// Constants
import { SYSTEM_ID } from '@system/constants';

Hooks.on<CosmereHooks.TestEnricherTrigger>(
    CosmereHooks.TestEnricherTrigger,
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

Hooks.on<CosmereHooks.DamageEnricherTrigger>(
    CosmereHooks.DamageEnricherTrigger,
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
