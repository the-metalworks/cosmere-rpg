import { CosmereItem } from '@system/documents/item';
import { IdItemDataSchema } from './id';

const SCHEMA = {
    expertise: new foundry.data.fields.BooleanField({
        required: true,
        nullable: false,
        initial: false,
        label: 'Expertise',
    }),
}

export type ExpertiseItemDataSchema = typeof SCHEMA;

export function ExpertiseItemMixin<TParent extends foundry.abstract.Document.Any>() {
    return (
        base: typeof foundry.abstract.TypeDataModel,
    ) => {
        return class extends base<ExpertiseItemDataSchema & IdItemDataSchema, TParent> {
            static defineSchema() {
                const superSchema = super.defineSchema();

                // Ensure schema contains id (id mixin was used)
                if (!('id' in superSchema)) {
                    throw new Error(
                        'ExpertiseItemMixin must be used in combination with IdItemMixin',
                    );
                }

                return foundry.utils.mergeObject(super.defineSchema(), SCHEMA);
            }

            public prepareDerivedData(): void {
                super.prepareDerivedData();

                const parent = this.parent;

                // Check if item type can be found in expertise types
                const isKnownExpertiseType =
                    parent.type in CONFIG.COSMERE.expertiseTypes;

                if (isKnownExpertiseType && !!parent.actor) {
                    // Check if the actor has the expertise
                    const actorHasExpertise =
                        parent.actor.system.expertises?.some(
                            (expertise) => expertise.id === this.id,
                        );

                    // If the actor has the expertise, enable it
                    if (actorHasExpertise) {
                        this.expertise = true;
                    }
                }
            }
        };
    };
}
