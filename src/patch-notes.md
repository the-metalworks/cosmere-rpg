### Patch 1.0.2 - September 2025

This is a small patch with a couple of bug fixes, errata for the starter rules, and some minor improvements on the backend of the system. 

#### 🛠️ Full Changelog

🐛 **Bug Fixes**

* Improved localization (#545)
* Resolved an issue that would cause errors to be thrown when closing sheets (#532)

📘 **Errata - 1.02**

* Updated the Reactive Strike action description 
* Added missing condition immunities for the Assassin and Cremling Swarm adversaries
* Updated the Axehound token to be consistent with the other modules
* Updated the Grappling Hook item description
* Updated the "Attacking" and "Variant: Using a Grid" sections in the Part 3: Combat
* Updated the "Weapons" section in the Part 6: Items

🛠 **System Features**

* Added the ability to register custom roll data through the API (#549)
* Made it possible to configure the header when embedding Items in journals (#556)

<br><br>
    
### Patch 1.0.1 - August 2025

The first post-release patch is here! This is a pretty small hotfix which focuses on some of our automation system bugs and various visual/styling problems across the board. We did manage to work in a new quality of life feature, though.

#### Feature Highlight, Singular

**Item Macros, At Last ⌨️**  
We can now, finally, present to you the least exciting but still really quite useful quality of life feature: dragging items to the macro bar from a character sheet now actually creates a macro to use that item, instead of opening its sheet! Amazing. This one may have sat on the back burner for a very long time, but hey, at least it's here now.

#### 🛠️ Full Changelog

💄 **Styling & UI**

* Adversary role and size options now have proper styling (#526)
* Adversary type options now have proper styling (#515)

📊 **System Mechanics & Data**

* API notifications were reworked to only create an error notification if there were actual errors logged (#509)
* Form events no longer update unrelated fields (#507)
* Expertises no longer lose track of their IDs when modifying a locked expertise (#505)

🐛 **Misc Fixes & Polish**

* Hotbar item macro support (#42)
* Talent prerequisite localization string fixed (#511)
* Hardcoded prerequisite text removed from Startling Blow talent (#524)
