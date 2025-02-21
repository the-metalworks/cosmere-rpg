import { SYSTEM_ID } from '../constants';
import { Theme } from '../types/cosmere';

/**
 * Index of identifiers for system templates.
 */
export const TEMPLATES = {
    GENERAL_TABS: 'general/tabs.hbs',
    GENERAL_SHEET_CORNERS: 'general/sheet-corners.hbs',
    GENERAL_SHEET_BACKGROUND: 'general/sheet-background.hbs',
    COMBAT_COMBATANT: 'combat/combatant.hbs',

    COMPONENT_DOCUMENT_DROP_LIST: 'general/components/document-drop-list.hbs',
    COMPONENT_DOCUMENT_REFERENCE: 'general/components/document-reference.hbs',
    COMPONENT_MULTI_VALUE_SELECT: 'general/components/multi-value-select.hbs',
    COMPONENT_ID_INPUT: 'general/components/id-input.hbs',
    COMPONENT_MULTI_STATE_TOGGLE: 'general/components/multi-state-toggle.hbs',

    // ACTOR BASE
    ACTOR_BASE_NAVIGATION: 'actors/parts/navigation.hbs',
    ACTOR_BASE_BOX_CORNERS: 'actors/parts/box-corners.hbs',
    ACTOR_BASE_SEARCH_BAR: 'actors/components/search-bar.hbs',
    ACTOR_BASE_ACTIONS_LIST: 'actors/components/actions-list.hbs',
    ACTOR_BASE_EFFECTS_LIST: 'actors/components/effects-list.hbs',
    ACTOR_BASE_EQUIPMENT_LIST: 'actors/components/equipment-list.hbs',
    ACTOR_BASE_INJURIES_LIST: 'actors/components/injuries-list.hbs',
    ACTOR_BASE_ATTRIBUTES: 'actors/components/attributes.hbs',
    ACTOR_BASE_CONDITIONS: 'actors/components/conditions.hbs',
    ACTOR_BASE_DETAILS: 'actors/components/details.hbs',
    ACTOR_BASE_RESOURCE: 'actors/components/resource.hbs',
    ACTOR_BASE_SKILL: 'actors/components/skill.hbs',
    ACTOR_BASE_SKILLS_GROUP: 'actors/components/skills-group.hbs',

    // ACTOR CHARACTER
    ACTOR_CHARACTER_HEADER: 'actors/character/parts/header.hbs',
    ACTOR_CHARACTER_CONTENT: 'actors/character/parts/content.hbs',
    ACTOR_CHARACTER_DETAILS_TAB:
        'actors/character/partials/char-details-tab.hbs',
    ACTOR_CHARACTER_ACTIONS_TAB:
        'actors/character/partials/char-actions-tab.hbs',
    ACTOR_CHARACTER_EQUIPMENT_TAB:
        'actors/character/partials/char-equipment-tab.hbs',
    ACTOR_CHARACTER_GOALS_TAB: 'actors/character/partials/char-goals-tab.hbs',
    ACTOR_CHARACTER_EFFECTS_TAB:
        'actors/character/partials/char-effects-tab.hbs',
    ACTOR_CHARACTER_ANCESTRY: 'actors/character/components/ancestry.hbs',
    ACTOR_CHARACTER_CULTURE: 'actors/character/components/culture.hbs',
    ACTOR_CHARACTER_EXPERTISES: 'actors/character/components/expertises.hbs',
    ACTOR_CHARACTER_FAVORITES: 'actors/character/components/favorites.hbs',
    ACTOR_CHARACTER_PATHS: 'actors/character/components/paths.hbs',
    ACTOR_CHARACTER_CONNECTIONS_LIST:
        'actors/character/components/connections-list.hbs',
    ACTOR_CHARACTER_GOALS_LIST: 'actors/character/components/goals-list.hbs',

    // ACTOR ADVERSARY
    ACTOR_ADVERSARY_HEADER: 'actors/adversary/parts/header.hbs',
    ACTOR_ADVERSARY_CONTENT: 'actors/adversary/parts/content.hbs',
    ACTOR_ADVERSARY_ACTIONS_TAB:
        'actors/adversary/partials/adv-actions-tab.hbs',
    ACTOR_ADVERSARY_EQUIPMENT_TAB:
        'actors/adversary/partials/adv-equipment-tab.hbs',
    ACTOR_ADVERSARY_EFFECTS_TAB:
        'actors/adversary/partials/adv-effects-tab.hbs',
    ACTOR_ADVERSARY_SKILLS_GROUP:
        'actors/adversary/components/skills-group.hbs',

    //ITEM
    ITEM_BASE_HEADER: 'item/parts/header.hbs',
    ITEM_BASE_CONTENT: 'item/parts/content.hbs',
    ITEM_BASE_PROPERTIES: 'item/components/properties.hbs',

    ITEM_ACTION_CONTENT: 'item/action/parts/content.hbs',
    ITEM_ANCESTRY_CONTENT: 'item/ancestry/parts/content.hbs',
    ITEM_ARMOR_CONTENT: 'item/armor/parts/content.hbs',
    ITEM_GOAL_CONTENT: 'item/goal/parts/content.hbs',
    ITEM_INJURY_CONTENT: 'item/injury/parts/content.hbs',
    ITEM_LOOT_CONTENT: 'item/loot/parts/content.hbs',
    ITEM_PATH_CONTENT: 'item/path/parts/content.hbs',
    ITEM_POWER_CONTENT: 'item/power/parts/content.hbs',
    ITEM_SPECIALTY_CONTENT: 'item/specialty/parts/content.hbs',
    ITEM_TALENT_CONTENT: 'item/talent/parts/content.hbs',

    ITEM_DESCRIPTION_TAB: 'item/partials/item-description-tab.hbs',
    ITEM_EFFECTS_TAB: 'item/partials/item-effects-tab.hbs',
    ITEM_DETAILS_TAB: 'item/partials/item-details-tab.hbs',
    ITEM_INJURY_DETAILS_TAB: 'item/injury/partials/injury-details-tab.hbs',
    ITEM_SPECIALTY_DETAILS_TAB:
        'item/specialty/partials/specialty-details-tab.hbs',
    ITEM_LOOT_DETAILS_TAB: 'item/loot/partials/loot-details-tab.hbs',
    ITEM_ARMOR_DETAILS_TAB: 'item/armor/partials/armor-details-tab.hbs',
    ITEM_ANCESTRY_DETAILS_TAB:
        'item/ancestry/partials/ancestry-details-tab.hbs',
    ITEM_TALENT_DETAILS_TAB: 'item/talent/partials/talent-details-tab.hbs',
    ITEM_ACTION_DETAILS_TAB: 'item/action/partials/action-details-tab.hbs',
    ITEM_GOAL_DETAILS_TAB: 'item/goal/partials/goal-details-tab.hbs',
    ITEM_POWER_DETAILS_TAB: 'item/power/partials/power-details-tab.hbs',
    ITEM_PATH_DETAILS_TAB: 'item/path/partials/path-details-tab.hbs',
    ITEM_TALENT_TREE_NODE_TOOLTIP:
        'item/talent-tree/partials/talent-tree-node-tooltip.hbs',

    ITEM_DETAILS_ID: 'item/components/details-id.hbs',
    ITEM_DETAILS_ACTIVATION: 'item/components/details-activation.hbs',
    ITEM_DETAILS_ATTACK: 'item/components/details-attack.hbs',
    ITEM_DETAILS_DAMAGE: 'item/components/details-damage.hbs',
    ITEM_DETAILS_EQUIP: 'item/components/details-equip.hbs',
    ITEM_DETAILS_MODALITY: 'item/components/details-modality.hbs',
    ITEM_DETAILS_TYPE: 'item/components/details-type.hbs',

    ITEM_EFFECTS_LIST: 'item/components/effects-list.hbs',
    ITEM_ANCESTRY_TALENT_LIST:
        'item/ancestry/components/advancement-talent-list.hbs',
    ITEM_ANCESTRY_BONUS_TALENTS: 'item/ancestry/components/bonus-talents.hbs',
    ITEM_GOAL_REWARDS_LIST: 'item/goal/components/rewards-list.hbs',
    ITEM_TALENT_GRANT_RULES_LIST: 'item/talent/components/grant-rules-list.hbs',

    //CHAT
    CHAT_CARD_HEADER: 'chat/card-header.hbs',
    CHAT_CARD_CONTENT: 'chat/card-content.hbs',
    CHAT_CARD_SECTION: 'chat/card-section.hbs',
    CHAT_CARD_DESCRIPTION: 'chat/card-description.hbs',
    CHAT_CARD_INJURY: 'chat/card-injury.hbs',
    CHAT_CARD_DAMAGE_TAKEN: 'chat/card-damage-taken.hbs',
    CHAT_CARD_DAMAGE_BUTTONS: 'chat/card-damage-buttons.hbs',

    CHAT_CARD_TRAY_TARGETS: 'chat/card-tray-targets.hbs',

    CHAT_ROLL_D20: 'chat/roll-d20.hbs',
    CHAT_ROLL_DAMAGE: 'chat/roll-damage.hbs',
    CHAT_ROLL_TOOLTIP: 'chat/roll-tooltip.hbs',

    CHAT_OVERLAY_D20: 'chat/overlay-d20.hbs',
    CHAT_OVERLAY_CRIT: 'chat/overlay-crit.hbs',

    //DIALOGS
    DIALOG_ACTOR_EDIT_EXPERTISES: 'actors/dialogs/edit-expertises.hbs',
    DIALOG_ACTOR_CONFIGURE_RESOURCE: 'actors/dialogs/configure-resource.hbs',
    DIALOG_ACTOR_CONFIGURE_DEFLECT: 'actors/dialogs/configure-deflect.hbs',
    DIALOG_ACTOR_CONFIGURE_DEFENSE: 'actors/dialogs/configure-defense.hbs',
    DIALOG_ACTOR_CONFIGURE_RECOVERY:
        'actors/dialogs/configure-recovery-die.hbs',
    DIALOG_ACTOR_CONFIGURE_MOVEMENT:
        'actors/dialogs/configure-movement-rate.hbs',
    DIALOG_ACTOR_CONFIGURE_SENSES: 'actors/dialogs/configure-senses-range.hbs',

    DIALOG_CHARACTER_SHORT_REST: 'actors/character/dialogs/short-rest.hbs',
    DIALOG_ADVERSARY_CONFIGURE_SKILLS:
        'actors/adversary/dialogs/configure-skills.hbs',

    DIALOG_ITEM_EDIT_REWARD: 'item/goal/dialogs/edit-reward.hbs',
    DIALOG_ITEM_EDIT_GRANT_RULE: 'item/talent/dialogs/edit-grant-rule.hbs',
} as const;

/**
 * Shortcut function to render a custom template from the system templates folder.
 * @param {string} template Name (or sub path) of the template in the templates folder.
 * @param {object} data The template data to render the template with.
 * @returns {Promise<string>} A rendered html template.
 * @private
 */
export function renderSystemTemplate(
    template: string,
    data: object,
): Promise<string> {
    return renderTemplate(`systems/${SYSTEM_ID}/templates/${template}`, data);
}

export const THEME_TAG = 'cosmere-theme';

/**
 * Set the theme on an element, removing the previous theme class in the process.
 * @param {HTMLElement} element Body or sheet element on which to set the theme data.
 * @param {Theme} [theme=Theme.Default] Theme key to set.
 * @param {string[]} [flags=[]] Additional theming flags to set.
 */
export function setTheme(
    element: HTMLElement,
    theme: Theme,
    flags = new Set(),
) {
    const previous = Array.from(element.classList).filter((c) =>
        c.startsWith(THEME_TAG),
    );
    element.classList.remove(...previous);
    element.classList.add(`${THEME_TAG}-${theme}`);
    element.dataset.theme = theme;
    element.dataset.themeFlags = Array.from(flags).join(' ');
}
