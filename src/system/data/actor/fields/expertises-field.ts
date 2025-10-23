import { ExpertiseType } from '@system/types/cosmere';
import {
    CollectionField,
    CollectionFieldOptions,
} from '../../fields/collection';

const SCHEMA = () => ({
    id: new foundry.data.fields.StringField({
        required: true,
        nullable: false,
        blank: false,
    }),
    type: new foundry.data.fields.StringField({
        required: true,
        nullable: false,
        blank: false,
        initial: Object.keys(CONFIG.COSMERE.expertiseTypes)[0] as ExpertiseType,
        choices: Object.entries(CONFIG.COSMERE.expertiseTypes)
            .map(([typeId, config]) => [typeId, config.label])
            .reduce(
                (acc, [key, value]) => ({
                    ...acc,
                    [key]: value,
                }),
                {} as Record<ExpertiseType, string>,
            ),
    }),
    label: new foundry.data.fields.StringField({
        required: false,
        nullable: true,
        blank: false,
    }),
    locked: new foundry.data.fields.BooleanField(),
});

type ExpertiseDataSchema = ReturnType<typeof SCHEMA>;
type ExpertiseData =
    foundry.data.fields.SchemaField.InitializedData<ExpertiseDataSchema>;

export class Expertise extends foundry.abstract.DataModel<
    ExpertiseDataSchema,
    foundry.abstract.Document.Any
> {
    static defineSchema() {
        return SCHEMA();
    }

    static getKey(expertise: ExpertiseData): string;
    static getKey(expertise: Partial<ExpertiseData>): string | null;
    static getKey(expertise: Partial<ExpertiseData>): string | null {
        if (!expertise.id || !expertise.type) return null;
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
            foundry.utils.getProperty(CONFIG.COSMERE, registryKey) as object,
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

type ExpertiseDataFieldOptions =
    foundry.data.fields.SchemaField.Options<ExpertiseDataSchema> & {
        required: true;
        nullable: false;
    };

export class ExpertiseDataField extends foundry.data.fields.SchemaField<
    ExpertiseDataSchema,
    ExpertiseDataFieldOptions,
    foundry.data.fields.SchemaField.Internal.InitializedType<
        ExpertiseDataSchema,
        ExpertiseDataFieldOptions
    >,
    Expertise
> {
    constructor(
        options?: Omit<
            foundry.data.fields.SchemaField.Options<ExpertiseDataSchema>,
            'required' | 'nullable'
        >,
        context?: foundry.data.fields.DataField.ConstructionContext,
    ) {
        super(
            Expertise.defineSchema(),
            {
                ...options,
                required: true,
                nullable: false,
            },
            context,
        );
    }

    protected override _cast(value: unknown) {
        return (
            value && typeof value === 'object' ? value : {}
        ) as ExpertiseData;
    }

    public override initialize(
        value: ExpertiseData,
        model: foundry.abstract.Document.Any,
        options?: object,
    ) {
        return new Expertise(foundry.utils.deepClone(value), {
            parent: model,
            ...options,
        });
    }
}

export class ExpertisesField extends CollectionField<ExpertiseDataField> {
    constructor(options: CollectionFieldOptions) {
        super(
            new ExpertiseDataField({
                label: 'EXPERTISE',
            }),
            {
                ...options,
                key: (item: Partial<ExpertiseData>) => Expertise.getKey(item),
            },
        );
    }
}
