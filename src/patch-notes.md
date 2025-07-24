### Patch 0.3.1 - May 2025

A final pre-release patch, mostly this fixes fairly major bugs and niggles with the system that required workarounds for standard play or were waiting on us to make some direction decisions about the code base.

... Buuut we might also have slipped in a little QoL feature that we were aiming for 1.0 but finished a little earlier! 🎉

## Feature Highlights

### Enrichers are here! ⚡

We have now added some custom enrichers for the Prosemirror editors in the system (excluding journals for now). These will provide some much needed relief for GMs wanting to make generic items (or use any of our compendium contents in multiple places when release arrives 😉) and not wanting to have to manually edit a load of boilerplate text for core functions of the system.

In brief this boils down to:
* You can now type `[[<enricher> <value> <options>]]` in item descriptions and PC notes fields and have cool stuff happen. This will even work in the chat panels
* Current offerings include:
  * a `lookup` that will insert the relevant value into the text where you want it.
  * a `test` tag that prints out a button in the description to quickly roll a skill test for the relevant actor
  * a `damage`/`healing` tag that produces a button which rolls a pool of dice as if they were a damage roll then prints to chat.

Of course each of these has a number of options you can use to tweak the full behaviour, but look at the [full documentation](https://github.com/the-metalworks/cosmere-rpg/wiki/Enrichers) to get the best picture.

For the more techy-minded out there, the interactable buttons are triggering their effects through the foundry Hook system, so feel free to extend these actions them to your heart's content. In future we may even look at having the enrichment process itself trigger a Hook, so watch this space for even more fun stuff!

#### Work In Progress
As this is still early days for us and there will be those of you who have different play and prep styles to us, you may think of something to do with these enrichers we haven't planned for yet, so do get in touch and pass on your feedback, bugs and (hopefully) some praise 😉

----

### 🛠️ Full Changelog

💄 **Styling & UI**
* Context menu for list items on the actor sheet improved location and closing mechanisms (#282)
* Custom Movement Rates now stick around once focus moves from the input dialog (#322)
* Various form fields will no longer get reset when other fields are updated separately (#306)
* Collapsible elements will now only toggle when their header line is clicked, to allow for interaction with enriched items in the body. (#242)
* Switching to HTML edit mode for prosemirror editors no longer restricts the editor's size (#317)
* Combat tracker has had a new lick of paint (#30)
* Talent trees are now addable to Ancestries (#313)
* Skills can now be set to a specific rank by clicking the pip rather than cycling up/down. (#137)
  * The previous method is available behind a setting
* Currencies now have a fall back icon (#303)

🧬 **Character System & Advancement**
* Setting a Resource's Max to be custom will no longer add any bonus present on update indefinitely (#346)
* Resource Bars with bonuses added to the max value will now account for them and clamp correctly (#347)
* Ancestry talents will now appear in the ancestry section of the actions list (#296)

📊 **System Mechanics & Data**
* Powers and Surges can now roll damage (#333)

🐛 **Misc Fixes & Polish**
* Actors no longer randomly ignore walls on maps (#300)
* Talent trees will now render correctly when opening an Item directly to the talents tab (#295)