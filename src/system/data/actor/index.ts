import { ActorType } from '@system/types/cosmere';

import { AdversaryActorDataModel, AdversaryActorDataSchema } from './adversary';
import { CharacterActorDataModel, CharacterActorDataSchema } from './character';

export const config = {
    [ActorType.Character]: CharacterActorDataModel,
    [ActorType.Adversary]: AdversaryActorDataModel,
} as const;

// export { AdversaryActorData } from './adversary';
// export { CharacterActorData } from './character';
export { CommonActorData, AttributeData } from './common';

declare module "@league-of-foundry-developers/foundry-vtt-types/configuration" {
    interface DataModelConfig {
        Actor: {
            [ActorType.Character]: foundry.abstract.TypeDataModel<CharacterActorDataSchema, foundry.abstract.Document.Any>;
            [ActorType.Adversary]: foundry.abstract.TypeDataModel<AdversaryActorDataSchema, foundry.abstract.Document.Any>;
        }
    }
}