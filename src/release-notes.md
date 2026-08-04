### Release 3.0.0
<sup>30th July 2026</sup>

Radiants and Worldhoppers, we have a new major release for you; 3.0 introduces several major reworks to prepare the system for the upcoming **Mistborn** release.

#### Embedded Actions
We've reworked how actions and activations are represented throughout the system. Prior to 3.0, weapons, talents, powers, and other items could each be configured with an activation, specifying how they could be used. However, this approach had several limitations, particularly for features that grant multiple actions. **Activations** have been replaced with **Embedded Actions**. Like events and effects, most items now have an "Actions" tab where their actions are managed. All **Activation**-related data now lives solely on **Actions**, and an item can have any number of actions embedded on it. The "Actions" tab on the character sheet displays a list of all actions available to the character, whether they come directly from the character or from one of their items.

#### Item resources & consumption
Like actors, items now support a list of resources, which are dynamically configurable through the system API (so custom item resources can be added by modules). Previously, items could only have uses or charges. Items can now track any number of supported resource types simultaneously. Resource consumption has been updated to match the new item resources system and includes improvements for selecting *where* resources are consumed from. There have also been a number of quality-of-life improvements around item resources, such as a new **Ammo** resource for ranged weapons.

#### Sheet Updates
The character sheet has received a substantial update to support the new Embedded Actions model. The most notable changes are the addition of a dedicated "Talents" tab and that the "Actions" tab no longer shows passive talents or other non-action entries.

#### 🛠️ Full Changelog

##### 📝 Features
- Added **Embedded Actions**, allowing items to own and manage their own actions.
- Added item resource support, including resource consumption, uses, charges, and the new **Ammo** resource type.
- Added automation for Weapon Strike actions and the Loaded trait.
- Added a dedicated **Talent** tab to the Character Sheet.
- Added support for Powers providing talents and Power prerequisites.
- Added current resource/charge display to actions.
- Added support for the latest conditions.
- Added migration support for existing worlds to the new Embedded Actions system.
- Added new combat-related triggers to the Event System.
- Updated Starter Rules to use the new Embedded Actions model.

##### 🐛 Bug Fixes
- Increased the maximum skill rank from **5** to **40** (sheet still only goes to 5).
- Fixed damage rolls for skill-test actions with configured damage.
- Fixed Recover correctly rolling Healing damage.

— **Team Metalworks**
