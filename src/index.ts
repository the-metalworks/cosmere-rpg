import { ActorType, Condition, ItemType } from './system/types/cosmere';

import COSMERE from './system/config';

import './style.scss';
import './system/hooks';

import { preloadHandlebarsTemplates } from './system/util/handlebars';
import { registerSettings } from './system/settings';

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

    CONFIG.ActiveEffect.legacyTransferral = false;

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

    // Load templates
    await preloadHandlebarsTemplates();

    // Register status effects
    registerStatusEffects();

    // Register settings
    registerSettings();
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
    Actors.registerSheet('cosmere-rpg', sheet as any, {
        types: [type],
        makeDefault: true,
        label: `TYPES.Actor.${type}`,
    });
}

function registerItemSheet(
    type: ItemType,
    sheet: typeof foundry.applications.api.ApplicationV2<any, any, any>,
) {
    Items.registerSheet('cosmere-rpg', sheet as any, {
        types: [type],
        makeDefault: true,
        label: `TYPES.Item.${type}`,
    });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
