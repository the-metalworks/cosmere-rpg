import type { EmbeddedTypesOf } from '@system/types/utils';

/**
 * The behavior to apply when an embed limit is exceeded.
 * - `block`: prevent the embed from being added
 * - `replace-first`: replace the first existing embed of this type
 * - `replace-last`: replace the last existing embed of this type
 */
export type ExceedBehavior = 'block' | 'replace-first' | 'replace-last';

interface BaseEmbedLimit {
    notify?: boolean;
}

/** Configuration for limiting embeds by count. */
export interface AmountLimitConfig extends BaseEmbedLimit {
    amount: {
        max: number;

        /**
         * @default 'block'
         */
        onExceed?: ExceedBehavior;
    };
}

export interface BooleanLimitConfig extends BaseEmbedLimit {
    allowed: boolean;
}

/**
 * Limits that can be applied to a specific embedded document type.
 */
export type EmbedLimit = AmountLimitConfig | BooleanLimitConfig;

/**
 * Configuration for a specific embedded document type.
 */
export type EmbedTypeConfig = boolean | EmbedLimit;

export type EmbeddedDocumentsConfig<
    DocumentName extends foundry.abstract.Document.Type,
> = {
    [DocumentType in
        | foundry.abstract.Document.SubTypesOf<DocumentName>
        | 'base']?: {
        [EmbeddedName in EmbeddedTypesOf<DocumentName>]?:
            | {
                  [EmbeddedType in
                      | foundry.abstract.Document.SubTypesOf<EmbeddedName>
                      | 'base']?: EmbedTypeConfig;
              }
            | false;
    };
};
