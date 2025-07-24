import { DamageRoll } from '@system/dice';
import { MESSAGE_TYPES } from '@system/documents/chat-message';
import { Attribute, DamageType, Skill } from '@system/types/cosmere';
import { CosmereHooks } from '@system/types/hooks';

// Utils
import { getActor } from '@system/utils/actor';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { HOOKS } from '@system/constants/hooks';

Hooks.on<CosmereHooks.TriggerTestEnricher>(
    HOOKS.TRIGGER_TEST_ENRICHER,
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

Hooks.on<CosmereHooks.TriggerDamageEnricher>(
    HOOKS.TRIGGER_DAMAGE_ENRICHER,
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
