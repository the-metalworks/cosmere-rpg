import { ActorType, Status, ItemType } from './system/types/cosmere';
import { AnyMutableObject } from './system/types/utils';
import { SYSTEM_ID } from './system/constants';
import { TEMPLATES } from './system/utils/templates';
import COSMERE from './system/config';

import './style.scss';
import './system/mixins';

import { registerItemEventSystem } from './system/hooks';

import { preloadHandlebarsTemplates } from './system/utils/handlebars';
import { registerCustomEnrichers } from './system/utils/enrichers';
import {
    registerDeferredSettings,
    registerSystemKeybindings,
    registerSystemSettings,
} from './system/settings';

import * as applications from './system/applications';
import * as dataModels from './system/data';
import * as documents from './system/documents';
import * as dice from './system/dice';

import Editor from './system/ui/editor';

import CosmereAPI from './system/api';
import CosmereUtils from './system/utils/global';

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
        utils: typeof CosmereUtils;
    };
}

Hooks.once('init', async () => {
    globalThis.cosmereRPG = Object.assign(game.system!, {
        api: CosmereAPI,
        utils: CosmereUtils,
    });

    CONFIG.COSMERE = COSMERE;

    CONFIG.ChatMessage.documentClass = documents.CosmereChatMessage;

    CONFIG.Actor.dataModels = dataModels.actor.config;
    CONFIG.Actor.documentClass = documents.CosmereActor;

    CONFIG.Item.dataModels = dataModels.item.config;
    CONFIG.Item.documentClass = documents.CosmereItem;

    CONFIG.Combat.documentClass = documents.CosmereCombat as typeof Combat;
    CONFIG.ui.combat = applications.combat.CosmereCombatTracker;

    // NOTE: Disabled for now as v12 doesn't permit users to update the system of combatants they own
    // (CONFIG.Combatant as AnyMutableObject).dataModels =
    //     dataModels.combatant.config;
    CONFIG.Combatant.documentClass =
        documents.CosmereCombatant as typeof Combatant;

    CONFIG.Token.documentClass = documents.CosmereTokenDocument;

    (CONFIG.ActiveEffect as AnyMutableObject).dataModels =
        dataModels.activeEffect.config;
    CONFIG.ActiveEffect.documentClass =
        documents.CosmereActiveEffect as typeof ActiveEffect;
    CONFIG.ActiveEffect.legacyTransferral = false;

    Roll.TOOLTIP_TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.CHAT_ROLL_TOOLTIP}`;

    // Add fonts
    configureFonts();

    // Register item event system event types & handlers
    registerItemEventSystem();

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

    CONFIG.Canvas.visionModes.sense = new VisionMode({
        id: 'sense',
        label: 'COSMERE.Actor.Statistics.SensesRange',
        canvas: {
            shader: ColorAdjustmentsSamplerShader,
            uniforms: { contrast: 0, saturation: -1.0, brightness: 0 },
        },
        lighting: {
            levels: {
                [VisionMode.LIGHTING_LEVELS.DIM]:
                    VisionMode.LIGHTING_LEVELS.BRIGHT,
            },
            background: { visibility: VisionMode.LIGHTING_VISIBILITY.REQUIRED },
        },
        vision: {
            darkness: { adaptive: false },
            defaults: {
                attenuation: 0,
                contrast: 0,
                saturation: -1.0,
                brightness: 0,
            },
        },
    });

    // Register status effects
    registerStatusEffects();

    // Register settings
    registerSystemSettings();
    registerSystemKeybindings();

    registerCustomEnrichers();

    // Load templates
    await preloadHandlebarsTemplates();

    // Activate the editor listeners
    Editor.activateListeners();

    // Set configuration through API
    applications.actor.configure();
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
 * statuses as status effects.
 */
function registerStatusEffects() {
    // Map statuses to status effects
    const statusEffects = (
        Object.keys(CONFIG.COSMERE.statuses) as Status[]
    ).map((status) => {
        // Get the config
        const config = CONFIG.COSMERE.statuses[status];

        return {
            id: status,
            name: config.label,
            img: config.icon,
            _id: `cond${status}`.padEnd(16, '0'),

            ...(config.stackable
                ? {
                      system: {
                          isStackable: true,
                          count: 1,
                      },
                  }
                : {}),
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
                        `systems/${SYSTEM_ID}/assets/fonts/laski-sans/LaskiSans-Regular.woff2`,
                    ],
                },
                {
                    urls: [
                        `systems/${SYSTEM_ID}/assets/fonts/laski-sans/LaskiSans-RegularItalic.woff2`,
                    ],
                    style: 'italic',
                },
                {
                    urls: [
                        `systems/${SYSTEM_ID}/assets/fonts/laski-sans/LaskiSans-Semibold.woff2`,
                    ],
                    weight: 600,
                },
                {
                    urls: [
                        `systems/${SYSTEM_ID}/assets/fonts/laski-sans/LaskiSans-SemiboldItalic.woff2`,
                    ],
                    weight: 600,
                    style: 'italic',
                },
                {
                    urls: [
                        `systems/${SYSTEM_ID}/assets/fonts/laski-sans/LaskiSans-Bold.woff2`,
                    ],
                    weight: 'bold',
                },
                {
                    urls: [
                        `systems/${SYSTEM_ID}/assets/fonts/laski-sans/LaskiSans-BoldItalic.woff2`,
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
                        `systems/${SYSTEM_ID}/assets/fonts/penumbra-serif-std/PenumbraSerifStd-Semibold.woff2`,
                    ],
                    weight: 600,
                },
                {
                    urls: [
                        `systems/${SYSTEM_ID}/assets/fonts/penumbra-serif-std/PenumbraSerifStd-Bold.woff2`,
                    ],
                    weight: 'bold',
                },
            ],
        },
        'Penumbra Serif Std SC': {
            editor: false,
            fonts: [
                {
                    urls: [
                        `systems/${SYSTEM_ID}/assets/fonts/penumbra-serif-std/PenumbraSerifStd-SemiboldCaps.woff2`,
                    ],
                    weight: 600,
                },
            ],
        },
        'Cosmere Dingbats': {
            editor: true,
            fonts: [
                {
                    urls: [
                        `systems/${SYSTEM_ID}/assets/fonts/cosmere-dingbats/CosmereDingbats-Regular.woff2`,
                    ],
                },
            ],
        },
        'Shally Handwritten': {
            editor: true,
            fonts: [
                {
                    urls: [
                        `systems/${SYSTEM_ID}/assets/fonts/shally-handwritten/Shally-Regular.woff2`,
                    ],
                },
            ],
        },
    });
}
