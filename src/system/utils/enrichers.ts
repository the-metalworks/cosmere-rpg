import { CosmereActor, CosmereActorRollData, CosmereItem } from '../documents';
import { Attribute, Skill } from '../types/cosmere';
import { TargetDescriptor } from './generic';

interface EnricherConfig {
    _config: string;
    values: string[];
    [key: string]: string | string[] | boolean | number;
}

export interface EnricherData {
    actor?: {
        name: string;
        type: string;
        attributes: {
            [AttributeShortName in Attribute]: number;
        };
        skills: {
            [SkillShortName in Skill]: { ranks: number; mod: number };
        };
        health: { max: number; value: number };
        focus: { max: number; value: number };
        investiture: { max: number; value: number };
        deflect: number;
        movementSpeed: {
            walk: number;
            fly: number;
            swim: number;
        };
        sensesRange: number;
        token?: {
            name: string;
        };
    };
    item: {
        name: string;
        charges?: {
            value: number;
            max: number;
        };
    };
    target?: TargetDescriptor;
}

const EnricherStyleOptions = {
    capitalize: (value: string) => value.capitalize(),
    lowercase: (value: string) => value.toLocaleLowerCase(),
    uppercase: (value: string) => value.toLocaleUpperCase(),
} as const;

/*
 * Note: Left in some commented out options that I copied across
 * from the 5e implementation that we might want to use later */

export function registerCustomEnrichers() {
    const stringNames = ['check', 'damage', 'healing', 'item', 'skill'];
    CONFIG.TextEditor.enrichers.push(
        // {
        //   pattern: new RegExp(`\\[\\[/(?<type>${stringNames.join("|")}) (?<config>[^\\]]+)]](?:{(?<label>[^}]+)})?`, "gi"),
        //   enricher: enrichString
        // },
        {
            pattern:
                /\[\[(?<type>lookup) (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
            enricher: enrichString,
        },
        // {
        //   pattern: /&(?<type>Reference)\[(?<config>[^\]]+)](?:{(?<label>[^}]+)})?/gi,
        //   enricher: enrichString
        // }
    );

    // document.body.addEventListener("click", applyAction);
    // document.body.addEventListener("click", rollAction);
}

/**
 * Parse the enriched string and provide the appropriate content.
 * @param {RegExpMatchArray}                match       The regular expression match result.
 * @param {TextEditor.EnrichmentOptions}    options    Options provided to customize text enrichment.
 * @returns {Promise<HTMLElement|null>}     An HTML element to insert in place of the matched text or null to
 *                                          indicate that no replacement should be made.
 */
function enrichString(
    match: RegExpMatchArray,
    options?: TextEditor.EnrichmentOptions,
) {
    const { type, label, config } = match.groups as {
        type: string;
        config: string;
        label: string;
    };
    const processedConfig = parseConfig(config);
    processedConfig._input = match[0];
    switch (type.toLowerCase()) {
        // case "healing": config._isHealing = true;
        // case "damage": return enrichDamage(config, label, options);
        // case "check":
        // case "skill": return enrichCheck(processedConfig, label, options);
        case 'lookup':
            return enrichLookup(processedConfig, label, options);
        // case "item": return enrichItem(config, label, options);
        // case "reference": return enrichReference(config, label, options);
    }
    return null;
}

/**
 * Parse a roll string into a configuration object.
 * @param {string} match  Matched configuration string.
 * @returns {object}
 */
function parseConfig(match: string) {
    const config: EnricherConfig = { _config: match, values: [] };
    for (const part of match.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []) {
        if (!part) continue;
        const [key, value] = part.split('=');
        const valueLower = value?.toLowerCase();

        if (value) {
            config[key] = ['true', 'false'].includes(valueLower)
                ? // convert number/boolean values to their primitives
                  valueLower === 'true'
                : Number.isNumeric(value)
                  ? Number(value)
                  : // otherwise it's a string, we just trim any "s
                    value.replace(/(^"|"$)/g, '');
            continue;
        }
        config.values.push(key.replace(/(^"|"$)/g, ''));
    }
    return config;
}

/**
 * Enrich a property lookup.
 * @param {object} config                         Configuration data.
 * @param {string} [fallback]                     Optional fallback if the value couldn't be found.
 * @param {TextEditor.EnrichmentOptions} options  Options provided to customize text enrichment.
 * @returns {HTMLElement|null}                    An HTML element if the lookup could be built, otherwise null.
 *
 * @example Include an actor's name in its description:
 * ```[[lookup @actor.name]]``
 * becomes
 * ```html
 * <span class="lookup-value">Actor Name</span>
 * ```
 * @example Providing a fallback incase the item doesn't have the requested key (or you made a typo!):
 * ```[[lookup @missing.name]]{Someone's Name}``
 * becomes
 * ```html
 * <span class="lookup-value">Someone's Name</span>
 * ```
 */
function enrichLookup(
    config: EnricherConfig,
    fallback?: string,
    options?: TextEditor.EnrichmentOptions,
) {
    // Pull out the values passed in
    let keyPath = config.path as string;
    let style = config.style as string | undefined;
    for (const value of config.values) {
        // get the data field name
        if (value.startsWith('@')) keyPath ??= value;
        // if this wasn't the keyPath then flag any of the accepted style options
        style ??= Object.keys(EnricherStyleOptions).includes(value)
            ? value
            : undefined; // discard anything else
    }

    if (!keyPath) {
        console.warn(
            `Lookup path must be defined to enrich ${config._input as string}.`,
        );
        return null;
    }

    // Make sure we've been passed an Item
    // N.B. if we want to use enrichers on the character notes sections or the like this will need a re-think
    const data =
        options?.relativeTo && options.relativeTo instanceof CosmereItem
            ? options.relativeTo.getEnricherData()
            : null;

    let value =
        (foundry.utils.getProperty(
            data ?? {},
            keyPath.substring(1),
        ) as string) ?? fallback;
    if (
        value &&
        style &&
        style in
            (Object.keys(
                EnricherStyleOptions,
            ) as (keyof typeof EnricherStyleOptions)[])
        // belt-and-braces to make sure we're only dealing with specifically accepted keywords
    ) {
        value =
            EnricherStyleOptions[style as keyof typeof EnricherStyleOptions](
                value,
            );
    }

    // insert the HTML element with the value
    const span = document.createElement('span');
    span.classList.add('lookup-value');
    if (!value) span.classList.add('not-found');
    span.innerText = value ?? keyPath;
    return span;
}
