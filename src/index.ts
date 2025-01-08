import { ActorType, Condition, ItemType } from './system/types/cosmere';
import { SYSTEM_ID } from './system/constants';
import { TEMPLATES } from './system/utils/templates';
import COSMERE from './system/config';

import './style.scss';
import './system/hooks';

import { preloadHandlebarsTemplates } from './system/utils/handlebars';
import {
    registerDeferredSettings,
    registerSystemKeybindings,
    registerSystemSettings,
} from './system/settings';

import * as applications from './system/applications';
import * as dataModels from './system/data';
import * as documents from './system/documents';
import * as dice from './system/dice';

import CosmereAPI from './system/api';

declare global {
    interface LenientGlobalVariableTypes {
        game: never; // the type doesn't matter
    }

    interface CONFIG {
        COSMERE: typeof COSMERE;
    }

    // NOTE: Must use var to affect globalThis
    // eslint-disable-next-line no-var
    var cosmereRPG: {
        api: typeof CosmereAPI;
    };
}

Hooks.once('init', async () => {
    globalThis.cosmereRPG = Object.assign(game.system!, { api: CosmereAPI });

    CONFIG.COSMERE = COSMERE;

    CONFIG.ChatMessage.documentClass = documents.CosmereChatMessage;

    CONFIG.Actor.dataModels = dataModels.actor.config;
    CONFIG.Actor.documentClass = documents.CosmereActor;

    CONFIG.Item.dataModels = dataModels.item.config;
    CONFIG.Item.documentClass = documents.CosmereItem;

    CONFIG.Combat.documentClass = documents.CosmereCombat;
    CONFIG.Combatant.documentClass = documents.CosmereCombatant;
    CONFIG.ui.combat = applications.combat.CosmereCombatTracker;

    CONFIG.Token.documentClass = documents.CosmereTokenDocument;

    Roll.TOOLTIP_TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.CHAT_ROLL_TOOLTIP}`;

    CONFIG.ActiveEffect.legacyTransferral = false;

    // Add fonts
    configureFonts();

    Actors.unregisterSheet('core', ActorSheet);
    registerActorSheet(ActorType.Character, applications.actor.CharacterSheet);
    registerActorSheet(ActorType.Adversary, applications.actor.AdversarySheet);

    Items.unregisterSheet('core', ItemSheet);
    registerItemSheet(ItemType.Culture, applications.item.CultureItemSheet);
    registerItemSheet(ItemType.Ancestry, applications.item.AncestrySheet);
    registerItemSheet(ItemType.Path, applications.item.PathItemSheet);
    registerItemSheet(
        ItemType.Connection,
        applications.item.ConnectionItemSheet,
    );
    registerItemSheet(ItemType.Injury, applications.item.InjuryItemSheet);
    registerItemSheet(ItemType.Specialty, applications.item.SpecialtyItemSheet);
    registerItemSheet(ItemType.Loot, applications.item.LootItemSheet);
    registerItemSheet(ItemType.Armor, applications.item.ArmorItemSheet);
    registerItemSheet(ItemType.Trait, applications.item.TraitItemSheet);
    registerItemSheet(ItemType.Action, applications.item.ActionItemSheet);
    registerItemSheet(ItemType.Talent, applications.item.TalentItemSheet);
    registerItemSheet(ItemType.Equipment, applications.item.EquipmentItemSheet);
    registerItemSheet(ItemType.Weapon, applications.item.WeaponItemSheet);
    registerItemSheet(ItemType.Goal, applications.item.GoalItemSheet);
    registerItemSheet(ItemType.Power, applications.item.PowerItemSheet);
    registerItemSheet(
        ItemType.TalentTree,
        applications.item.TalentTreeItemSheet,
    );

    CONFIG.Dice.types.push(dice.PlotDie);
    CONFIG.Dice.terms.p = dice.PlotDie;
    CONFIG.Dice.termTypes[dice.PlotDie.name] = dice.PlotDie;

    // NOTE: foundry-vtt-types has two version of the RollTerm class which do not match
    // causing this to error. Bug?
    // @league-of-foundry-developers/foundry-vtt-types/src/foundry/client/dice/term.d.mts
    // @league-of-foundry-developers/foundry-vtt-types/src/foundry/client-esm/dice/terms/term.d.mts
    // @ts-expect-error see note
    CONFIG.Dice.rolls.push(dice.D20Roll);
    // @ts-expect-error see note
    CONFIG.Dice.rolls.push(dice.DamageRoll);

    // Register status effects
    registerStatusEffects();

    // Register settings
    registerSystemSettings();
    registerSystemKeybindings();

    // Load templates
    await preloadHandlebarsTemplates();
});

Hooks.once('setup', () => {
    // Register some settings after modules have had a chance to initialize
    registerDeferredSettings();
});

Hooks.once('ready', () => {
    // Chat message listeners
    documents.CosmereChatMessage.activateListeners();
});

/**
 * Helper function to register the configured
 * conditions as status effects.
 */
function registerStatusEffects() {
    // Map conditions to status effects
    const statusEffects = (
        Object.keys(CONFIG.COSMERE.conditions) as Condition[]
    ).map((condition) => {
        // Get the config
        const config = CONFIG.COSMERE.conditions[condition];

        return {
            id: condition,
            name: config.label,
            img: config.icon,
            _id: `cond${condition}`.padEnd(16, '0'),
        };
    });

    // Register status effects
    CONFIG.statusEffects = statusEffects;
}

// NOTE: Must cast to `any` as registerSheet type doesn't accept ApplicationV2 (even though it's valid to pass it)
/* eslint-disable @typescript-eslint/no-explicit-any */
function registerActorSheet(
    type: ActorType,
    sheet: typeof foundry.applications.api.ApplicationV2<any, any, any>,
) {
    Actors.registerSheet(SYSTEM_ID, sheet as any, {
        types: [type],
        makeDefault: true,
        label: `TYPES.Actor.${type}`,
    });
}

function registerItemSheet(
    type: ItemType,
    sheet: typeof foundry.applications.api.ApplicationV2<any, any, any>,
) {
    Items.registerSheet(SYSTEM_ID, sheet as any, {
        types: [type],
        makeDefault: true,
        label: `TYPES.Item.${type}`,
    });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Configure additional system fonts.
 */
function configureFonts() {
    Object.assign(CONFIG.fontDefinitions, {
        'Laski Sans': {
            editor: true,
            fonts: [
                {
                    urls: [
                        'https://dl.dropboxusercontent.com/scl/fi/hurpbzjvud4y79wzo1qmy/laskisans-regular.woff2?rlkey=x0zcwzfm6eebo32sspe2k4vaf&st=an65ir3o&raw=1&t=.woff2',
                    ],
                },
                {
                    urls: [
                        'https://dl.dropboxusercontent.com/scl/fi/bjc6al0vethbf2iuzwyyx/laskisans-regular-italic.woff2?rlkey=jhzcjg9lhtz2i2txqalo99gli&st=66dgwytm&raw=1&t=.woff2',
                    ],
                    style: 'italic',
                },
                {
                    urls: [
                        'https://dl.dropboxusercontent.com/scl/fi/a4jijkz42ipmdyitpmbxd/laskisans-semibold.woff2?rlkey=wbluvl1zwltyo3q9bu3jrvg0y&st=ce9ca470&raw=1&t=.woff2',
                    ],
                    weight: 600,
                },
                {
                    urls: [
                        'https://dl.dropboxusercontent.com/scl/fi/e5wxxfoi8mdsgegune2xj/laskisans-semibold-italic.woff2?rlkey=y6kqrwr8bmnidc2ekk5ki0pa8&st=p8sdfoqw&raw=1&t=.woff2',
                    ],
                    weight: 600,
                    style: 'italic',
                },
                {
                    urls: [
                        'https://dl.dropboxusercontent.com/scl/fi/hkmjpw6sw4pyezj557h78/laskisans-bold.woff2?rlkey=lhw92l3utcsi5hjgxylap7clq&st=8h5hzj3k&raw=1&t=.woff2',
                    ],
                    weight: 'bold',
                },
                {
                    urls: [
                        'https://dl.dropboxusercontent.com/scl/fi/vr2aztvrotqq1kfvte764/laskisans-bold-italic.woff2?rlkey=xpcjdvbpt29z3vhj5p6gyk2a1&st=ae1h3tg0&raw=1&t=.woff2',
                    ],
                    weight: 'bold',
                    style: 'italic',
                },
            ],
        },
        'Roboto Condensed': {
            editor: true,
            fonts: [
                {
                    urls: [
                        `systems/${SYSTEM_ID}/assets/fonts/roboto-condensed/RobotoCondensed-Regular.woff2`,
                    ],
                },
                {
                    urls: [
                        `systems/${SYSTEM_ID}/assets/fonts/roboto-condensed/RobotoCondensed-Bold.woff2`,
                    ],
                    weight: 'bold',
                },
                {
                    urls: [
                        `systems/${SYSTEM_ID}/assets/fonts/roboto-condensed/RobotoCondensed-Italic.woff2`,
                    ],
                    style: 'italic',
                },
                {
                    urls: [
                        `systems/${SYSTEM_ID}/assets/fonts/roboto-condensed/RobotoCondensed-BoldItalic.woff2`,
                    ],
                    weight: 'bold',
                    style: 'italic',
                },
            ],
        },
        'Penumbra Serif Std': {
            editor: true,
            fonts: [
                {
                    urls: [
                        'https://dl.dropboxusercontent.com/scl/fi/2j1lf6u9bomt98kczfp6y/penumbraserifstd-semibold.woff2?rlkey=bokq6lhb03ykbev021r897ek8&st=338qxdqi&raw=1&t=.woff2',
                    ],
                    weight: 600,
                },
                {
                    urls: [
                        'https://dl.dropboxusercontent.com/scl/fi/xuudjnlwwgznlofmgsv3o/penumbraserifstd-bold.woff2?rlkey=lqvjr1dsdnrph2dux1kocltgo&st=61a55kr9&raw=1&t=.woff2',
                    ],
                    weight: 'bold',
                },
            ],
        },
        'Cosmere Dingbats': {
            editor: true,
            fonts: [
                {
                    urls: [
                        'https://dl.dropboxusercontent.com/scl/fi/e9olw2h4gnnxue5utcv0b/cosmeredingbats-regular.woff2?rlkey=ff8qwiubwtsno06cwtrow68z3&st=gulsaibc&raw=1&t=.woff2',
                    ],
                },
            ],
        },
        'Shally Handwritten': {
            editor: true,
            fonts: [
                {
                    urls: [
                        'https://dl.dropboxusercontent.com/scl/fi/xogyrq7wvzbhc77nlv0fx/shally-regular.woff2?rlkey=2eui52g7ervpt0n0wj7calg3a&st=mi4swhe8&raw=1&t=.woff2',
                    ],
                },
            ],
        },
    });
}
