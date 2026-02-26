### Patch 2.0.5
<sup>2026-02-26</sup>

A few more fixes to document sheets and a styling change in the combat tracker!

#### 🛠️ Full Changelog

🐛 **Bug Fixes**

* Fixed an issue with the last patch which caused actor portraits to not save properly when updated
* Fixed an issue where character sheets would fail to render if an embedded item contained a recharge mode of 'None'
* Fixed an issue with the Restrained condition displaying extra text when hovering it in a character sheet
* Fixed an issue with several talents in the starter rules where the Attribute of their skill test field was undefined
* Fixed an issue causing the fast turn section of the combat tracker to inherit erroneous styling
* Fixed an issue where the actor that used an item was not always passed along the use chain

<br>

----

### Patch 2.0.4
<sup>2026-02-06</sup>

This patch fixes just a couple small bugs related to character sheets and file browser interactions.

#### 🛠️ Full Changelog

🐛 **Bug Fixes**

* Fixed an issue causing character sheet scrolling to be blocked when the Foundry performance mode setting was set to "low"
* Fixed an issue with file browser while hosting on the Forge that prevented using Forge Assets when accessing it from actor and item sheets

<br>

----

### Patch 2.0.3
<sup>2025-11-15</sup>

This patch fixes some larger remaining bugs of the V13 release, addressing issues with the event system, talent trees, and sheets.

**Note.** Patch `2.0.2` contained an issue with our internal data models that could cause problems when deleting entries from collection fields (such as removing an expertise or deleting an event rule). Patch `2.0.2` has been made unavailable from Foundry.

#### 🛠️ Full Changelog

🐛 **Bug Fixes**

* Fixed an issue causing context menus to appear in the wrong location and sometimes be inaccessible
* Resolved a problem where the width of embedded Talent Trees would not account for the name
* Corrected the event system’s `update-item` handler so it no longer requires an item to be configured when the target is set to Equipped Weapon or Equipped Armour
* Fixed an issue causing you to be unable to update event system handlers fields, due to failing data validation
* Adjusted actor sheet styling to prevent the portrait’s shadow from exceeding its bounds, resulting in a black box
* Updated improvised weapons to be correctly configured as Special Weapons in the *Stormlight Starter Rules*

<br>

----

### Patch 2.0.1
<sup>2025-10-30</sup>

This is a small patch addressing some of the issues found in the initial V13 release.

#### 🛠️ Full Changelog

🐛 **Bug Fixes**
* Fixed an issue causing Active Effect changes to be unintentionally persisted when updating ProseMirror fields (Biography, Appearance, Notes) on actor sheets
* Resolved a bug that caused header controls to be duplicated on actor sheets
* Removed the window drop shadow to prevent display issues in Firefox
* Fixed an issue where the selected roll mode was not being respected when rolling any Item (talent, action, etc.) from an actor sheet
