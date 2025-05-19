import { ExpertiseType } from '@system/types/cosmere';
import {
    CollectionField,
    CollectionFieldOptions,
} from '../../fields/collection';

export interface ExpertiseData {
    /**
     * The unique identifier for the expertise
     *
     * @example "hammer"
     */
    id: string;

    /**
     * The type of expertise
     *
     * @example "weapon"
     */
    type: ExpertiseType;

    /**
     * Optional label. Used only for custom expertises.
     * Standard expertises will use the label from the config.
     */
    label?: string | null;

    /**
     * Whether or not the status of this expertise can be edited.
     */
    locked?: boolean;
}

export class ExpertisesField extends CollectionField<
    foundry.data.fields.SchemaField,
    ExpertiseData
> {
    constructor(options: Omit<CollectionFieldOptions<ExpertiseData>, 'key'>) {
        super(
            new ExpertiseDataField({
                label: 'EXPERTISE',
            }),
            {
                ...options,
                key: (item: ExpertiseData) => Expertise.getKey(item),
            },
        );
    }
}

export class ExpertiseDataField extends foundry.data.fields.SchemaField {
    constructor(
        options?: foundry.data.fields.DataFieldOptions,
        context?: foundry.data.fields.DataFieldContext,
    ) {
        super(Expertise.defineSchema(), options, context);
    }

    protected override _cast(value: unknown) {
        return typeof value === 'object' ? value : {};
    }

    public override initialize(
        value: ExpertiseData,
        model: object,
        options?: object,
    ) {
        return new Expertise(foundry.utils.deepClone(value), {
            parent: model,
            ...options,
        });
    }
}

export class Expertise extends foundry.abstract.DataModel<ExpertiseData> {
    static defineSchema() {
        return {
            id: new foundry.data.fields.StringField({
                required: true,
                nullable: false,
                blank: false,
            }),
            type: new foundry.data.fields.StringField({
                required: true,
                nullable: false,
                blank: false,
                initial: Object.keys(CONFIG.COSMERE.expertiseTypes)[0],
                choices: Object.entries(CONFIG.COSMERE.expertiseTypes)
                    .map(([typeId, config]) => [typeId, config.label])
                    .reduce(
                        (acc, [key, value]) => ({
                            ...acc,
                            [key]: value,
                        }),
                        {},
                    ),
            }),
            label: new foundry.data.fields.StringField({
                required: false,
                nullable: true,
                blank: false,
            }),
            locked: new foundry.data.fields.BooleanField(),
        };
    }

    static getKey(expertise: ExpertiseData): string {
        return `${expertise.type}:${expertise.id}`;
    }

    /* --- Accessors --- */

    public get key(): string {
        return Expertise.getKey(this);
    }

    public get isCustom(): boolean {
        // Get the registry key
        const registryKey =
            CONFIG.COSMERE.expertiseTypes[this.type].configRegistryKey;
        if (!registryKey) return true;

        // Check if the expertise is registered in the config, a custom expertise is not registered
        return !foundry.utils.hasProperty(
            foundry.utils.getProperty(CONFIG.COSMERE, registryKey),
            this.id,
        );
    }

    public get typeLabel(): string {
        return CONFIG.COSMERE.expertiseTypes[this.type].label;
    }

    /* --- Lifecycle --- */

    protected override _initialize(options: object) {
        super._initialize(options);

        // Override the label field
        Object.defineProperty(this, 'label', {
            get: () => {
                // If the expertise is custom, use the label from the config
                if (this.isCustom)
                    return (this._source as ExpertiseData).label ?? this.id;

                // Get the registry key
                const registryKey =
                    CONFIG.COSMERE.expertiseTypes[this.type].configRegistryKey;
                if (!registryKey) return this.id;

                // Get the label from the config
                return foundry.utils.getProperty(
                    CONFIG.COSMERE,
                    `${registryKey}.${this.id}.label`,
                ) as string;
            },
            set: (value: string | null) => {
                // If the expertise is custom, use the label from the config
                if (this.isCustom) {
                    (this._source as ExpertiseData).label = value;
                }
            },
            configurable: true,
        });
    }
}
