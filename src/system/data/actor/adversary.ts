import { AdversaryRole } from '@system/types/cosmere';
import { CommonActorDataModel, CommonActorDataSchema } from './common';

const SCHEMA = {
    role: new foundry.data.fields.StringField({
        required: true,
        nullable: false,
        blank: false,
        initial: AdversaryRole.Minion,
        choices: Object.keys(CONFIG.COSMERE.adversary.roles),
    }),
};

export type AdversaryActorDataSchema =
    & typeof SCHEMA
    & CommonActorDataSchema;

export class AdversaryActorDataModel extends CommonActorDataModel<AdversaryActorDataSchema> {
    public static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA);
    }
}
