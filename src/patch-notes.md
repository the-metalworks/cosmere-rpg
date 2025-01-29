### Patch 0.2.2
Welcome to 2025 everyone! To begin the year of the Cosmere RPG off right, we're releasing this small patch with a few key improvements that you've been asking for.

#### What's New
- **Roll Modifiers**
  - Added functionality to add global modifiers to any item with a Skill Roll Activation through the Item Details tab.
  - Added functionality to set Ad-hoc modifiers to any roll in the roll configuration dialog.
  - These can both make use of the @ syntax to pull through Character stats
  - *Warning - the @ syntax might not be perfect for the temporary modifiers. Please let us know if you have recreatable issues!*
- Added **Scaling Damage Dice** for Unarmed Attacks!
  - ⬆️**Data Update:** This change creates a new @ property (`scalar.damage.unarmed`) that can be used in item damage roll formulas, therefore existing characters using the existing item will not get updated automatically.<br />We are also releasing 0.2.2 of the playtest materials module with those items updated, but for any existing games you will need to either import the new unarmed attack from there, or manually update existing actors.
- Added **Multiple Descriptions** to Items
  - Now you can insert different descriptions for an item with different levels of verbosity based on what you want to see where.
  - We have Chat, Short and Standard in order of priority for which is printed to the chat card.
- **Injuries** can now be rolled and applied from the chat card

#### Fixes
- **Actor Sheets:** Fixed an issue where using or recharging an item would reset the scroll position of the equipement list screen.
- **Chat Cards:** Improved the dice breakdown to handle multiple damage die rolls.

----

### Patch 0.2.1
A small release with fixes for bugs introduced with the last release and a handful of QoL updates.  

⚠️ **Important:** Release `0.2.0` of the playtest materials contains a bug causing all weapons to apply the damage modifer twice. Please update your playtest materials module to the latest version if you haven't already.

#### What's New  
- **Chat Cards:**  
  - Added reroll functionality.  
  - Added animation when switching between regular damage and graze.  
  - Added the ability to upgrade a damage roll to a critical.  
  - Improved damage notifications styling.  
- **Character Sheet:**  
  - Added a context menu option to mark Actions and Items as favorites.  

#### Fixes  
- **Items:** Fixed an issue where dragging and dropping items onto the favorites section didn’t mark them correctly.  
- **Goals:** Resolved bug preventing new goals from being added.  
- **Damage Rolls:** Fixed an issue where rolls with no dice would cause an error and break. 