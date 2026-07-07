import type { Document } from '@system/types/foundry/document';

import type { EmbeddedDocumentsConfig } from './types';
import type {
    EmbeddedTypesOf,
    DocumentTypeOf,
    TypedCreateDataForName,
} from '@system/types/utils';

import { isAmountLimit, isBooleanLimit, isEmbedLimit } from './utils';

export function EmbedConfigMixin<
    const DocumentClass extends Document.Constructable.SystemConstructor,
    const DocumentType extends
        foundry.abstract.Document.Type = DocumentTypeOf<DocumentClass>,
>(cls: DocumentClass) {
    return class EmbedConfigDocument extends cls {
        declare static metadata: foundry.abstract.Document.MetadataFor<DocumentType> & {
            embeddedConfig: EmbeddedDocumentsConfig<DocumentType>;
        };

        public override async createEmbeddedDocuments<
            EmbeddedName extends EmbeddedTypesOf<DocumentType>,
        >(
            embeddedName: EmbeddedName,
            data: TypedCreateDataForName<EmbeddedName>[] | undefined,
            operation?: foundry.abstract.Document.Database.CreateOperationForName<EmbeddedName>,
        ) {
            if (!('type' in this) || !data || data.length === 0)
                return super.createEmbeddedDocuments(
                    embeddedName as never,
                    data as never,
                    operation as never,
                );

            const typeConfig = {
                ...(this.constructor as unknown as typeof EmbedConfigDocument)
                    .metadata.embeddedConfig.base,
                ...(this.constructor as unknown as typeof EmbedConfigDocument)
                    .metadata.embeddedConfig[
                    this
                        .type as foundry.abstract.Document.SubTypesOf<DocumentType>
                ],
            };
            if (!typeConfig)
                return super.createEmbeddedDocuments(
                    embeddedName as never,
                    data as never,
                    operation as never,
                );

            const applicableConfig = typeConfig[embeddedName];
            if (applicableConfig === undefined)
                return super.createEmbeddedDocuments(
                    embeddedName as never,
                    data as never,
                    operation as never,
                );

            if (applicableConfig === false)
                throw new Error(
                    `Cannot embed ${String(embeddedName)} on ${this.documentName} of type ${String(this.type)}`,
                );

            // Validate creation
            data = data.filter((d) => {
                const embedConfig =
                    applicableConfig[d.type] ?? applicableConfig.base;

                if (embedConfig === false) {
                    throw new Error(
                        `Cannot embed ${String(embeddedName)} of type ${d.type} on ${this.documentName}`,
                    );
                }

                if (
                    isEmbedLimit(embedConfig) &&
                    isBooleanLimit(embedConfig) &&
                    embedConfig.allowed === false
                ) {
                    if (embedConfig.notify) {
                        ui.notifications?.warn(
                            `Cannot embed ${String(embeddedName)} of type ${d.type} on ${this.documentName}`,
                        );
                    }

                    console.warn(
                        `Cannot embed ${String(embeddedName)} of type ${d.type} on ${this.documentName}`,
                    );
                    return false;
                }

                if (isEmbedLimit(embedConfig) && isAmountLimit(embedConfig)) {
                    const {
                        amount: { max, onExceed = 'block' },
                        notify: shouldNotify = false,
                    } = embedConfig;

                    if (onExceed === 'block') {
                        const collection = this.getEmbeddedCollection(
                            embeddedName as never,
                        ) as foundry.abstract.EmbeddedCollection<
                            foundry.abstract.Document.Any,
                            foundry.abstract.Document.Any
                        > | null;
                        const existingCount =
                            collection?.filter(
                                (doc) => 'type' in doc && doc.type === d.type,
                            ).length ?? 0;
                        const batchCount = data!.filter(
                            (item) => item.type === d.type,
                        ).length; // TODO: Only count up to the current item, to allow multiple embeds of the same type in one batch up to the limit

                        if (existingCount + batchCount > max) {
                            if (shouldNotify) {
                                ui.notifications?.warn(
                                    `Cannot embed more than ${max} ${d.type} on ${this.documentName} of type ${String(this.type)}`,
                                );
                            }

                            console.warn(
                                `Cannot embed more than ${max} ${d.type} on ${this.documentName} of type ${String(this.type)}`,
                            );
                            return false;
                        }
                    }
                }

                return true;
            });

            // Perform create
            const results = (await super.createEmbeddedDocuments(
                embeddedName as never,
                data as never,
                operation as never,
            )) as (foundry.abstract.Document.StoredForName<EmbeddedName> & {
                type: foundry.abstract.Document.SubTypesOf<EmbeddedName>;
            })[];

            // Post-create: enforce amount limits for replace strategies
            const createdTypes = new Set<string>();
            results.forEach((result) => {
                createdTypes.add(result.type as string);
            });

            for (const type of createdTypes) {
                const embedConfig =
                    applicableConfig[
                        type as foundry.abstract.Document.SubTypesOf<EmbeddedName>
                    ] ?? applicableConfig.base;
                if (!isEmbedLimit(embedConfig) || !isAmountLimit(embedConfig))
                    continue;

                const {
                    amount: { max, onExceed = 'block' },
                    notify: shouldNotify = false,
                } = embedConfig;
                if (onExceed !== 'replace-first' && onExceed !== 'replace-last')
                    continue;

                const collection = this.getEmbeddedCollection(
                    embeddedName as never,
                ) as foundry.abstract.EmbeddedCollection<
                    foundry.abstract.Document.Any,
                    foundry.abstract.Document.Any
                > | null;
                if (!collection) continue;

                const allOfType = [...collection].filter(
                    (d) => 'type' in d && d.type === type,
                );
                const excess = allOfType.length - max;

                if (excess <= 0) continue;

                if (shouldNotify) {
                    ui.notifications?.warn(
                        `Replaced ${excess} ${type} embed(s) on ${this.documentName}: limit of ${max} reached`,
                    );
                }

                const toDelete =
                    onExceed === 'replace-first'
                        ? allOfType.slice(0, excess)
                        : allOfType.slice(-excess);

                //@ts-expect-error - Document.Any has the delete method typed with operation as never.
                toDelete.forEach((d) => void d.delete());
            }

            // Return result
            return results;
        }
    };
}
