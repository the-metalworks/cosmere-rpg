import { ActorType } from '@system/types/cosmere';

import { AdversaryActorDataModel } from './adversary';
import { CharacterActorDataModel } from './character';

export const config = {
    [ActorType.Character]: CharacterActorDataModel,
    [ActorType.Adversary]: AdversaryActorDataModel,
};

export { AdversaryActorData } from './adversary';
export { CharacterActorData } from './character';
export { CommonActorData, AttributeData } from './common';
