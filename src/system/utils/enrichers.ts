import { CosmereActor, CosmereItem } from '../documents';
import { AttributeConfig, SkillConfig } from '../types/config';
import { Attribute, AttributeGroup, DamageType, Skill } from '../types/cosmere';
import { getActor } from './actor';
import { TargetDescriptor } from './generic';

// Constants
import { SYSTEM_ID } from '@system/constants';

// Full Documentation: https://github.com/the-metalworks/cosmere-rpg/wiki/Enrichers

interface EnricherConfig {
    _config: string;
    values: string[];
    [key: string]: string | string[] | boolean | number;
}

export interface EnricherData {
    actor?: ReturnType<CosmereActor['getRollData']>;
    item?: {
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
    const stringNames = ['test', 'damage', 'healing', 'item'];
    CONFIG.TextEditor.enrichers.push(
        {
            pattern: new RegExp(
                `\\[\\[(?<type>${stringNames.join('|')}) (?<config>[^\\]]+)]](?:{(?<label>[^}]+)})?`,
                'gi',
            ),
            enricher: enrichString,
        },
        {
            pattern:
                /\[\[(?<type>lookup) (?<config>[^\]]+)]](?:{(?<label>[^}]+)})?/gi,
            enricher: enrichString,
        },
        // {
        //   pattern: /&(?<type>Reference)\[(?<config>[^\]]+)](?:{(?<label>[^}]+)})?/gi,
        //   enricher: enrichString
        // }
        {
            pattern: /@Link\[(?<uuid>.+)\]/gi,
            enricher: (
                match: RegExpMatchArray,
                options?: TextEditor.EnrichmentOptions,
            ) => {
                // Get the UUID from the match
                const uuid = match.groups?.uuid;
                if (!uuid) return null;

                // Create section element
                const section = document.createElement('section');

                // Add classes
                section.classList.add('content-link-anchor');

                // Parse the uuid
                const { id, collection, type } = foundry.utils.parseUuid(uuid);

                // Set attributes
                section.setAttribute('draggable', 'true');
                section.setAttribute('data-link', '');
                section.dataset.uuid = uuid;
                section.dataset.id = id;
                section.dataset.type = type;

                if (collection instanceof CompendiumCollection)
                    section.dataset.pack = collection.collection as string;

                // Return the section element
                return section;
            },
        },
        {
            pattern: /@Link/gi,
            enricher: (
                match: RegExpMatchArray,
                options?: TextEditor.EnrichmentOptions,
            ) => {
                // Create section element
                const section = document.createElement('section');
                section.classList.add('content-link-anchor');
                return section;
            },
        },
    );
}

/* --- Helpers --- */

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
        case 'healing': {
            processedConfig.healing = true;
            return enrichDamage(processedConfig, label, options);
        }
        case 'damage':
            return enrichDamage(processedConfig, label, options);
        case 'test':
            return enrichTest(processedConfig, label, options);
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

function createErrorSpan(text: string) {
    const span = document.createElement('span');
    span.innerText = `[${game.i18n?.localize('GENERIC.Enrichers.Error')} - ${game.i18n?.localize(text)}]`;
    return span;
}

function buildTestLabel(
    config: EnricherConfig,
    skill?: SkillConfig,
    attr?: AttributeConfig,
) {
    let linkLabel = '',
        postLink = '';
    if (skill) {
        linkLabel = `${game.i18n?.localize(skill.label)} `;
        const attributeName = attr
            ? game.i18n?.localize(attr?.label)
            : undefined;
        if (attributeName) {
            linkLabel = `${linkLabel}(${attributeName}) `;
        }
        linkLabel = `${linkLabel}${game.i18n?.localize('GENERIC.Test')}`;
    }
    if (config.dc && !config.defense)
        postLink = `${game.i18n?.localize('GENERIC.Enrichers.Test.Against')} ${game.i18n?.localize('GENERIC.DC')} ${config.dc as string | number}`;
    if (config.defense)
        postLink = `${game.i18n?.localize('GENERIC.Enrichers.Test.VsDefense')} ${config.defenseName as string} ${game.i18n?.localize('COSMERE.Actor.Statistics.Defense')}${config.dc ? ` (${game.i18n?.localize('GENERIC.DC')}: ${config.dc as number})` : ''}`;
    return { linkLabel, postLink };
}

function createRollLink(
    linkLabel: string,
    postLink: string,
    type: string,
    options?: {
        actorId?: string;
        source: string;
        data: Record<string, unknown>;
    },
) {
    const span = document.createElement('span');
    span.classList.add('enricher-link');
    span.innerHTML = `
        <a onclick="Hooks.call('${SYSTEM_ID}.trigger${type.titleCase()}Enricher', &quot;${options?.actorId}&quot;, &quot;${options?.source}&quot;, ${JSON.stringify(options?.data).replaceAll('"', '&quot;')})">
            <i class="fa-solid fa-dice-d20"></i> ${linkLabel}
        </a> ${postLink}
    `;
    return span;
}

/* --- Enrichers --- */

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
 * For full examples see https://github.com/the-metalworks/cosmere-rpg/wiki/Enrichers#data-lookups
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
        return createErrorSpan('GENERIC.Enrichers.Lookup.NoPath');
    }

    const data =
        options?.relativeTo &&
        (options.relativeTo instanceof CosmereItem ||
            options.relativeTo instanceof CosmereActor)
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

/**
 * Enrich a Test (dice roll) link to perform a specific attribute or skill test. If an attribute is provided
 * along with a skill, then the skill test will always use the provided attribute. Otherwise it will use
 * the character's default attribute for that skill.
 * @param {object} config                           Configuration data.
 * @param {string} [label]                          Optional label to replace default text.
 * @param {TextEditor.EnrichmentOptions} options    Options provided to customize text enrichment.
 * @returns {HTMLElement|null}                      An HTML link if the check could be built, otherwise null.
 *
 * @example Create an Intimidation test:
 * ```[[test skill=inm]]```
 * becomes
 * ```html
 * <span class="enricher-link">
 *      <a onclick="Hooks.on('cosmere-rpg.triggerTestEnricher', "Actor.####", "Source.uuid",{"skill":"inm", "attribute"=""})">
 *          <i class="fa-solid fa-dice-d20"></i> Intimidation test
 *      </a>
 * </span>
 * ```
 *
 * For full examples see https://github.com/the-metalworks/cosmere-rpg/wiki/Enrichers#tests
 */
function enrichTest(
    config: EnricherConfig,
    label?: string,
    options?: TextEditor.EnrichmentOptions,
) {
    const source = options?.relativeTo;
    let skillConfig: SkillConfig | undefined = undefined;
    let attributeConfig: AttributeConfig | undefined = undefined;
    if (config.skill && typeof config.skill === 'string') {
        skillConfig = CONFIG.COSMERE.skills[config.skill as Skill];
    }
    if (!skillConfig) {
        return createErrorSpan('GENERIC.Enrichers.Test.NoSkill');
    }
    if (config.attribute && typeof config.attribute === 'string') {
        attributeConfig =
            CONFIG.COSMERE.attributes[config.attribute as Attribute];
    }

    const data = (
        source as unknown as CosmereActor | CosmereItem
    ).getEnricherData();
    if (config.dc && typeof config.dc === 'string') {
        try {
            const evaluator = new Roll(config.dc, data);
            config.dc = evaluator.isDeterministic
                ? evaluator.evaluateSync().total
                : 0;
        } catch (error) {
            console.error(error);
            config.dc = 0;
        }
    }

    // Account for regional differences
    if (config.defence) {
        config.defense = config.defence;
        delete config.defence;
    }
    if (config.defense) {
        config.defenseName =
            game.i18n?.localize(
                CONFIG.COSMERE.attributeGroups[config.defense as AttributeGroup]
                    .label,
            ) ??
            game.i18n?.localize('COSMERE.Actor.Statistics.Defense') ??
            'Bad Config';
        config.dc =
            data.target?.def[config.defense as 'phy' | 'spi' | 'cog'] ?? 0;
    }

    const labelText = label
        ? { linkLabel: label, postLink: '' }
        : buildTestLabel(config, skillConfig, attributeConfig);
    const linkOptions = {
        actorId:
            source instanceof CosmereActor
                ? source.uuid
                : ((source as unknown as CosmereItem).actor?.uuid ?? ''),
        source: source?.uuid ?? '',
        data: {
            skill: skillConfig?.key ?? '',
            attribute: attributeConfig?.key ?? '',
            dc: config.dc as string,
            target: data.target,
        },
    };

    return createRollLink(
        labelText.linkLabel,
        labelText.postLink,
        'test',
        linkOptions,
    );
}

/**
 * Enrich the text with a button to make a roll and produce a damage/healing chat card.
 *
 * @param {object} config                           Configuration data.
 * @param {string} [label]                          Optional label to replace default text.
 * @param {TextEditor.EnrichmentOptions} options    Options provided to customize text enrichment.
 * @returns {HTMLElement|null}                      An HTML link if the check could be built, otherwise null.
 *
 * @example Simple damage roll:
 * ```[[damage 2d8 Vital]]```
 * becomes
 * ```html
 * <span class="enricher-link">
 *      <a onclick="Hooks.on('cosmere-rpg.triggerDamageEnricher', "Actor.####", "Source.uuid",{"formula":"2d8", "damageType":"vital"})">
 *          <i class="fa-solid fa-dice-d20"></i> 2d8 Vital
 *      </a> damage
 * </span>
 * ```
 *
 * For full examples see https://github.com/the-metalworks/cosmere-rpg/wiki/Enrichers#damage--healing
 */
async function enrichDamage(
    config: EnricherConfig,
    label: string,
    options?: TextEditor.EnrichmentOptions,
) {
    const formulaParts = [];
    // extract input params
    const { values } = config;
    let { formula, type, healing, setValue } = config;
    if (formula) formulaParts.push(formula);
    if (healing) {
        if (type)
            return createErrorSpan('GENERIC.Enrichers.Damage.DoubleTyped');
        type = 'Healing';
    }
    if (type === 'Healing') healing = true;
    for (const value of values) {
        if (value.toLowerCase() === 'average') {
            if (!setValue) setValue = true;
        } else if (
            value.toLowerCase() === 'healing' ||
            value.toLowerCase() === 'heal'
        ) {
            if (!healing) {
                healing = true;
                type = 'Healing';
            }
        } else if (value in DamageType) {
            if (!type) type = value;
            if (value.toLowerCase() === 'healing') healing = true;
        } else formulaParts.push(value);
    }
    // Check we got things passed in correctly
    if (formulaParts.length === 0)
        return createErrorSpan('GENERIC.Enrichers.Damage.NoFormula');
    if (!type) return createErrorSpan('GENERIC.Enrichers.Damage.NoType');
    if (typeof type !== 'string' || !(type in DamageType))
        return createErrorSpan('GENERIC.Enrichers.Damage.BadType');

    const source = options?.relativeTo;
    // grab the actor (we need the roll data unfortunately)
    const data = (
        source as unknown as CosmereActor | CosmereItem
    ).getEnricherData();

    // convert any actor properties passed in. Note: currently it doesn't collate like terms...
    // This will need tweaking when allowing multiple damage types if we got that route
    const terms = Roll.simplifyTerms(
        Roll.defaultImplementation.parse(
            formulaParts.join(' + '),
            data.actor ?? {},
        ),
    );
    formula = terms.map((t) => t.formula).join(' ');
    // calculate the average
    const minRoll = Roll.create(formula).evaluate({ minimize: true });
    const maxRoll = Roll.create(formula).evaluate({ maximize: true });
    const rawAverage = Math.floor(
        ((await minRoll).total + (await maxRoll).total) / 2,
    );
    if (setValue && typeof setValue !== 'number') setValue = rawAverage;

    // Set up the display content

    // encode the data for the click action
    const linkOptions = {
        actorId:
            source instanceof CosmereActor
                ? source.uuid
                : ((source as unknown as CosmereItem).actor?.uuid ?? ''),
        source: source?.uuid ?? '',
        data: {
            formula: setValue,
            healing,
            damageType: healing ? 'heal' : type.toLowerCase(),
        },
    };

    // If there is a set value given, we'll need a pair of links
    const container = document.createElement('span');
    if (setValue) {
        const valueLink = createRollLink(
            `${setValue}`,
            '',
            'damage',
            linkOptions,
        );
        container.insertAdjacentElement('afterbegin', valueLink);
    }

    linkOptions.data.formula = formula;
    const labelText = label
        ? label
        : `${setValue ? `(` : ''}${formula}${setValue ? ')' : ''} ${type}`;
    const poolLink = createRollLink(
        labelText,
        !healing && !label ? ' damage' : '',
        'damage',
        linkOptions,
    );
    container.insertAdjacentElement('beforeend', poolLink);
    return container;
}
