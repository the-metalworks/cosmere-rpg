### Release 0.3.0

We’ve spent the last while working through some of the system’s rougher edges — improving how it looks, how it feels to use, and how it handles some key mechanics. It’s a mix of long-overdue upgrades, quality-of-life fixes, and a few big steps forward.

We’re really happy with how it’s coming together. Here’s the highlights:

#### ✨ A Fresh Coat of Paint

Everything has been restyled — character sheets, dialogs, items, etc. The system now supports themes, and ships with a new default **Cosmere** theme that looks great in both light and dark mode. 

We’ve focused on making the interface feel cleaner, smoother, and easier to use, while still fitting the tone of the Cosmere. Character sheets in particular should feel more polished, with the helpful additions of fields for **biography, appearance, and personal notes**.

Here’s what it looks like now:

![image](https://github.com/user-attachments/assets/0c571e32-44f6-4a2c-b589-0cd8d888be22)

#### 🌿 Talent Trees, Rebuilt from the Ground Up

Talent trees have been completely rewritten to be more flexible and easier to manage.

- Talents can now be **freely positioned** anywhere in the tree.
- The tree interface now supports **panning and zooming**, and you can **capture your current view** so it always opens exactly how you want it.
- **Nested trees** are fully supported — you can now drop one tree directly into another.
- **Prerequisites** are now handled by the tree itself, not individual talents.
- Trees can now be **linked to Paths**, and when they are, the new **“Talents” tab** on the path sheet will show the tree and let players unlock talents directly from there.

The talent tree configuration screen is still missing some styling — it’s fully functional, just a little ugly for now. We’ll be cleaning it up in a patch soon.

> ⚠️ Because of the changes, **custom trees can’t be fully migrated**. The system will preserve what it can, but prerequisites will need to be set up again manually.

![image](https://github.com/user-attachments/assets/dfcef74a-7170-4a27-b7a8-25359f71c42e)

#### 📈 Characters Can Now Level Up

You can now set a character’s **level**, and the system will automatically adjust their max health and tier to match. Like most fields, level is editable directly from the sheet in edit mode.

Both `@level` and `@tier` are now available in roll data too, and we’ve updated the playtest materials to take advantage of that where needed. This is just the start — more advancement tools will be coming in future updates.

#### 🎲 Better Advantage/Disadvantage

The roll dialog has been cleaned up and upgraded:

- You can now pick **which dice** have advantage or disadvantage.
- **Plot dice** now support (dis)advantage too. After you roll, you’ll get a quick dialog to choose which result to use.

These changes bring the mechanics in line with the rules at last — and the interface is a lot nicer to work with.

![image](https://github.com/user-attachments/assets/34f027ab-acc4-4100-9f51-70b02382b02d)
![image](https://github.com/user-attachments/assets/69491f23-4e14-42d6-a703-c9c1e83743ef)

---

#### 🛠 Changelog

##### 💄 Styling & UI
- Complete visual refresh across all sheets and dialogs  
- Added theme support, including a new default **Cosmere** theme  
- Light mode is now fully supported  
- Roll dialog restyled and upgraded  
- Added a setting to toggle whether item descriptions are expanded by default  
- New character sheet fields: **biography, appearance, and personal notes**

##### 🧬 Character System & Advancement
- Characters can now have a **Level**, which updates their max Health and Tier automatically  
- Levels and Tiers are available in roll formulas (`@level`, `@tier`)  
- Power scaling is now included in roll formulas (`@scalar.power.grv.die`) 
- Currencies are now tracked and displayed on the character sheet   
- Fast and slow turns can now happen simultaneously for boss adversaries  

##### 🌳 Talent Trees
- Talent Trees have been completely rewritten  
- Prerequisites are now defined at the tree level, not on individual talents  
- **Nested talent trees** are supported — drop a tree onto another and the whole thing gets added.  
- Talent Trees can now be **linked to Paths**, and shown on the path sheet in a new “Talents” tab     

##### 🎲 Dice & Rolls
- Roll dialog now supports picking individual dice for **advantage/disadvantage**  
- Damage dice now support advantage/disadvantage
- **Plot die (dis)advantage** now uses a dialog to let players choose the final result  
- Chat cards for damage rolls now support a modifier dialog with keybinds and options  

##### 📊 System Mechanics & Data
- Improvements to how derived statistics are calculated and updated  
- Active Effects can now use actor roll data  
- Attribute bonuses now apply correctly to scalar attributes  
- Additional movement types added
- Added **hooks** for various system events — documentation coming soon    

##### 🐛 Fixes & Polish
- Ctrl+S now properly saves item descriptions
- Fixed an issue where defense bonuses were being applied twice
- Fixed localization for “light” and “heavy” weapon traits  
- Search bar and sorting issues on some sheets resolved  
- Currency values now correctly update and evaluate  
- General code cleanup and usability improvements throughout 

<br>

---  

<br>

This will likely be the last big release before **1.0**. While we'll still be putting out bug fixes and addressing issues, from here on our main focus is getting everything ready for launch.

Thanks, as always, to everyone who's been testing, building, or just playing and enjoying the system. Hope this update makes your next session a little smoother.

— **Team Metalworks**