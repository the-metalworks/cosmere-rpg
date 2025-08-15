import { ActorType } from '@system/types/cosmere';

import { AdversaryActorDataModel } from './adversary';
import { CharacterActorDataModel } from './character';

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
            [ActorType.Character]: typeof CharacterActorDataModel,
            [ActorType.Adversary]: typeof AdversaryActorDataModel
        }
    }
}