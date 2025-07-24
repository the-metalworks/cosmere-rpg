import { AdversaryRole } from '@system/types/cosmere';
import { CommonActorDataModel, CommonActorData } from './common';
import { DerivedValueField } from '../fields';

export interface AdversaryActorData extends CommonActorData {
    role: AdversaryRole;
}

export class AdversaryActorDataModel extends CommonActorDataModel<AdversaryActorData> {
    public static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), {
            role: new foundry.data.fields.StringField({
                required: true,
                nullable: false,
                blank: false,
                initial: AdversaryRole.Minion,
                choices: Object.keys(CONFIG.COSMERE.adversary.roles),
            }),
        });
    }
}
