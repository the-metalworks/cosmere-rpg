### Release 1.0.0 ✨

⛈️ **Strap into your stormshelters folks, release day is finally here!** ⛈️

Allow me to welcome you to the first major release version of the Cosmere RPG System - Official FoundryVTT implementation. We here at the Metalworks have been working so hard to make this available to all and to do so at a standard suited to telling stories in the marvelous Cosmere!
We also wish to take a brief moment to thank the staff at Brotherwise for giving us this opportunity and their enthusiastic support throughout.

#### 👋🏻 An Introduction

While we have been generously permitted to share this system publicly during it's early development (and it will continue to be Open Source!), this release marks the point at which we believe it now provides the quality of experience that the work Brandon, Dragonsteel and Brotherwise deserves at the table. We have laboured to make sure we aligned this with the wider Digital Release for the Kickstarter materials and the opening of general sales, so we expect a number of fresh faces will be reading this!
For those budding Worldhoppers, this release note will be a little broader than usual and our usual highlights will cover a broad base of what the system offers. For those veterans who've been installing the system manually and are leveling up to higher Ideals, I hope you find something new in here, but there is also the full **changelog** below too!

#### 👥 Character & Adversary Sheets

To those of you new to Foundry, if you look up to the top-right corner of the screen you will see the side panel with a number of tabs (Chat should be open by default). It's in this sidebar that most of the system goodies can be found. In the **Actors tab (![Image of the Actors Icon](https://github.com/user-attachments/assets/7a012fee-8ae7-45a7-9412-f727b9aa93e9))** you can manage all the characters you will need for your game and we have provided unique sheets designed specifically for the Cosmere RPG.

![Image of a Player Character Sheet]()

These sheets will help you out by:
- Tracking all number of derived stats
- Allowing custom overrides and temporary bonuses
- Manage your resources
- Provide one-click rolling
- Host your inventory
- Track goals, connections and conditions

*Remember that anywhere you can click on an element of the sheet to trigger a roll, there are also modifier keys you can use for short-cutting to common game states (e.g. rolling with advantage on your d20) so you can skip the configuration dialog if you want to be quick.*

And for GMs we have created a separate, slightly more slimline version for adversaries that attempts to highlight the key parts of their statblocks while remaining consistent with the PC sheets.

#### 🌳 Talent Trees

We include fully interactive talent trees! GMs can create their own, or insert a copy of one of the Official trees from their own physical or PDF copy of the handbook.

![Image of Windrunner Talent Tree]()

As you can see, you can:
- Nest trees within trees to build up the specialization lines for a path
- Apply a Background image and manipulate the positioning of Talents and the View box.
- Manage Prerequisites for Talents
- Attach trees to paths
  - This means players can then view the tree from their character sheet when the path is added
  - A Path added to a character can have the talents added and removed with a single click

#### 🎲 Rolls Shouldn't Be Testing

(Sorry for the terrible pun!)
One of the key benefits of any VTT is taking away the pesky math involved in rolling your dice, and we have put lots of effort into making sure that rolling a Test in the Cosmere System is as smooth as we can make it.

Whenever you activate an item or click a skill from your sheet, you will be given a chance to Raise the Stakes, apply conditional bonuses and advantage/disadvantage.

![Image of the Roll Configuration Dialog]()

Then when submitted you'll see the dice results pop-up in the chat window (see in the example how the weapon rolls the damage die at the same time for you)! Including full support for Opportunity and Complication calculations 😀

If you use Foundry's targeting feature to select a token at roll time, you will see that the target's defenses are shown in the card too for quick hit/miss recognition.

![Image of a weapon's attack roll Chat Message]()

You will also get the chance to pick your plot die result when rolling it with advantage/disadvantage!

![Image of the pick dialog](https://github.com/user-attachments/assets/69491f23-4e14-42d6-a703-c9c1e83743ef)

When a roll has damage dice involved you will see there are a set of buttons beneath that will apply the rolled amount to any selected or targeted tokens (and the blue eye will deduct a Focus for those going for a Graze), these will also take into account any relevant Deflect or Immunities the victim might have.

![Image of a Damage application Chat Message]()

Be sure to hover your mouse over the chart cards and try click on various sections to see what they do! On top of standard interactions to show the roll breakdowns we have controls for applying advantage/disadvantage to existing d20s and to convert a damage roll to a crit 💥

*Also note that those of you who've installed the **Dice So Nice!** module will get immediate full 3D dice support. Yes, that means the Plot Die too!*

#### ⏳ Initiative Tracking

When you open the **Combat tab (![Image of the Combat Icon](https://github.com/user-attachments/assets/e79b54ce-ed50-4ab3-a10c-5abd10d0d3cd))** you can not only create encounters, but:
- Track Fast and Slow Actors
- Track who has activated
- Have Boss-type Adversaries automatically have each of their slots
- Switch any Actor between their respective Fast and Slow groups

And I'd say we do so with *style*, Goncho!

![Image of the Encounter Tracker]()

#### 📦 Items Of All Sorts!

The next tab that's going to be a favourite for all you GMs: **Items (![Image of the Items tab Icon](https://github.com/user-attachments/assets/5589bc26-2b78-4f2d-b09f-c7ffcf1f857))**.

Here you will create any non-living objects you might want your Characters to interact with. But that's not to say these are all physical items! We have provided specific item types for all the key mechanics in the game (Talents, Paths, Ancestries, Cultures, etc.), so if you want to make your own *Anything* then this is the place to do it!

![Image of an Item Details tab]()

These can be drag-and-dropped from the sidebar onto any sheet and a completely separate copy will be added to the relevant list on the sheet. GMs can either use the Compendium from the premium modules to provide a pre-made list of options for their games, or import them into their Items tab to allow for editing or restricting access.

Editing and Building items is some of the most involved features of the system, so please check our documentation for full guides, but here's a brief overview of what is at your fingertips:

- Add an activate-able action to almost any Item type!
  - Actions can have costs both in Actions and Character Resources
  - Practically any Attribute/Skill combo can be accounted for
  - Damage rolls can be added to any action, and custom formulas provided for Graze damage
- An comprehensive Events system that can tie the various types of Item together
  - Equipment that unlocks Expertises or adds Skills on pickup
  - Kits that bundle gear
  - Talents that can alter character stats on Use
  - And so much more!
- Define the types of damage that armor can deflect
- Create re-usable Features for Adversaries that you can drag onto NPCs whenever you need

#### 🏃🏻‍➡️ Starter Kit Included

Along with the base system functionality, we are delighted to be including the contents of Brotherwise's free Starter Rules!

This means that you have access to a small number of Journals, Items and NPC Actors that can help both to provide a basis for a short adventure within common Stormlight scenarios and as blueprints for the way *we* build out the game content and use the system. Definitely open them up and learn what can be done!

The Starter Content can be found in the **Compendiums tab (![Image of the Compendium Icon](https://github.com/user-attachments/assets/2d4c2b71-66cc-451a-aa18-e2635ab50d7e))**, where you can open up the journals to find the Rules or import the various Character Features, Gear and Adversaries to use in your campaigns! This tab is where you will find uneditable copies of any external module content you enable in your server - including the Official Premium Modules, so check here first. These are intended for reference and taking verbatim copies, if you need to edit anything you see here, you'll need to import a copy into your world.

#### 💲 Premium Modules Available

Today's release also means that all the Premium Modules we have made to lovingly convert each of the published books to the Foundry VTT ecosystem are now available on the foundry store! For a better idea of whats on offer for each one, check out their Store pages, or look at some of our earlier teaser posts in the Reddit!

Once purchased, a license for the content will be applied to your Foundry account and associated with any licenses for the base platform you own so that from then on whenever you use your FoundryVTT license code to unlock a Foundry server, the content will be available to download from the Add-On Modules browser in the set-up screen.

As with the Starter Rules, when these modules are enabled on a world you will find them in the Compendiums tab. We place a single compendium for each module at the top level which holds all the Journals representing the digital equivalent of the printed book, then provide a separate folder with the Compendiums that contain any Items or Actors that we are providing for that module.

These also include extra little sections specific to Foundry to help you use the content in the slickest way possible, so be sure to look out for them to see just how far we've gone 😉

#### 🎂 Everything Else

Right, this is getting quite long, so lets get through the rest in Rapid Fire!

- **UI Themes:** We have a free base theme with both Dark and Light variants, but if that doesn't scratch your itch and you have the know-how to make your own, we allow 3rd party modules to register their own custom themes!
- **Settings:** Do check out the settings menu for the world, we have tried not to overwhelm you with options, but from there you can define default behaviour for things like which keys act as your click modifiers, how setting skills ranks should be and more.
- **Roll Tables:** Look into the **Roll Tables tab (![Image of the Rolltable Icon](https://github.com/user-attachments/assets/0e3fb743-2e89-4e6e-8f19-63a69674597a))** to find a tool that lets you create random generator tables and roll on them; Here we provide one for applying an injury to a character.
- **Enrichers:** Create rich, interactive elements right inline with your text boxes! We have added special tags that can be applied to any large text fields (excepting Journals currently) that can replace themselves with:
  - Values pulled from the Item in question or it's owning Actor
  - A button that triggers a skill roll for the owning Actor
  - A button that can make a standalone damage roll

#### 🎊 And More to Come!

This has hopefully highlighted key parts of the foundry interface and our system within that, but we know we can do better. In the future we will have more thorough User Guides available on our [GitHub Wiki](https://github.com/the-metalworks/cosmere-rpg/wiki) and using the in-built Foundry Tours tool.
And here's a glimpse at something more...
- Character Builder
- More retroactive roll controls
- More Enrichers
- Expansion of the Events and Effects features as well as the way Item Actions are handled

---

#### 🛠 Changelog

Here are the changes between this version and the previous public release (0.3.1). Note that we have done our best to ensure wherever any data model or other breaking changes have occurred that we have provided automatic data migrations to keep your worlds compatible. However, as is always the advice before opening a world from an older version of the system, take a backup and be aware some manual data work might be necessary. If you have an issue please reach out to us in the tech-support channel of our Discord.

##### 💄 Styling & UI
- 

##### 🧬 Character System & Advancement
- 

##### 🌳 Talent Trees
-   

##### 🎲 Dice & Rolls
- 

##### 📊 System Mechanics & Data
- 

##### 🐛 Fixes & Polish
- 

<br>

---  

<br>

Whew! That was a bit of a whistle-stop tour of what we've got in here, but even that was scratching the surface and we probably missed something! So please come visit us on [Discord](https://discord.gg/GwGTMknXhp) and get to know us, or look out for our supporting documentation to help you get to grips with the finer points of how to use the system. You can also find this whole message on our [Github Release Page](https://github.com/the-metalworks/cosmere-rpg/releases).

As always, but especially with today's release, the biggest of thanks to everyone who's been testing, building, or just playing and enjoying the system. And please look at the acknowledgements page of the Starter Rules for those exceedingly brave ~~Skaa~~ Bridge Crews who have helped us in our own closed playtesting.

— **Team Metalworks**
