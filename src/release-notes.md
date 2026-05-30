### Release 2.1.0 ✨
<sup>15th May 2026</sup>

Minor release which includes a few new features and some non-breaking changes to existing ones. Most notably we have added some very limited resizing ability to player character sheets and the ability to collapse various sections of the list tabs (such as actions and equipment). Yep, at long last, some of you with smaller screens can see your whole sheet. Further work on enhancing sheets to allow more dynamic font sizes and scalings is in the works, but still a bit away. Hopefully this helps people in the meantime!

#### 🛠️ Full Changelog

##### 📝 Features

* Token Configuration defaults are now set by system ([#278](https://github.com/the-metalworks/cosmere-rpg/issues/278))
* Actor action and equipment tab sections can now collapse for easier sheet navigation ([#541](https://github.com/the-metalworks/cosmere-rpg/issues/541) & ([#715](https://github.com/the-metalworks/cosmere-rpg/issues/715)))
* Encumbrance is now tracked on the character sheet (([#648](https://github.com/the-metalworks/cosmere-rpg/issues/648)))
* Events can now be toggled on/off to better control their activation ([#661](https://github.com/the-metalworks/cosmere-rpg/issues/661))
* The actor sheet for player characters can now be resized within certain bounds ([#636](https://github.com/the-metalworks/cosmere-rpg/issues/636))

##### 🐛 Bug Fixes

* Derived values no longer become NaN upon stats exceeding 10 using active effects ([#684](https://github.com/the-metalworks/cosmere-rpg/issues/684))
* Weapon range fields now appear as expected when selecting attack type ([#705](https://github.com/the-metalworks/cosmere-rpg/issues/705))
* Grant Items handler on event rules can now scroll when necessary ([#713](https://github.com/the-metalworks/cosmere-rpg/issues/713))

— **Team Metalworks**
