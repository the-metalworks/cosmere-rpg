import { AdversaryRole } from '@system/types/cosmere';
import type { CommonActorDataSchema } from './common';
import { CommonActorDataModel } from './common';

const SCHEMA = () => ({
    role: new foundry.data.fields.StringField({
        required: true,
        nullable: false,
        blank: false,
        initial: AdversaryRole.Minion,
        choices: Object.keys(CONFIG.COSMERE.adversary.roles) as AdversaryRole[],
    }),
});

export type AdversaryActorDataSchema =
    & ReturnType<typeof SCHEMA>
    & CommonActorDataSchema;

export class AdversaryActorDataModel extends CommonActorDataModel<AdversaryActorDataSchema> {
    public static defineSchema() {
        return foundry.utils.mergeObject(super.defineSchema(), SCHEMA());
    }
}
