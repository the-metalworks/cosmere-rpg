# Enrichers

Enrichers are special markdown style tags used in the prosemirror Text Editor input that are detected by the Editor when the value is displayed and replaces the tag with a calculated HTML Element.

We provide custom Enrichers in the system to allow either short-hands for complex formatting or to insert dynamic and interactive elements. All our enrichers will follow a standard format of `[[<tag-name> <details>]]{Text Override}`, though each type will be defined below with a more accurate format breakdown.

## Data Lookups

Data lookups are enrichers that will replace themselves with specific data values and attributes from within the context of the Application Document the editor sits in. In most cases this will be either an Item or an Actor, and most often an Item.

**Format**

```[[lookup @property.path style]]{fallback text}```

> `style` can be "lowercase", "uppercase" or "capitalize" and the output will have the native javascript functions for the named string transformations run on it.

**Examples**
|Use Case|Tag|HTML Output|
|---|---|---|
|Include an actor's name in its description|`[[lookup @actor.name]]`|`<span class="lookup-value">Actor Name</span>`|
|Grab the name of the current item and uppercase it|`[[lookup @item.name uppercase]]`|`<span class="lookup-value">ITEM NAME</span>`|
|Providing a fallback incase the item doesn't have the requested key (or you made a typo!)|`[[lookup @missing.name]]{Someone's Name}`|`<span class="lookup-value not-found">Someone's Name</span>`|
|Key is missing and no fallback given|`[[lookup @missing.name]]`|`<span class="lookup-value not-found">@missing.name</span>`|
|Didn't Provide a Path|`[[lookup lowercase]]`|`<span>[ENRICHER ERROR - No Path Provided]</span>`|

### Data Values

The values you can pull out to use in the lookup enricher are stored in a specific data structure that uses its top-level keys to specify where the data should come from and what these keys can refer to may change subtly based on the context in which they are being accessed.

The top-level fields are `actor`, `item` and `target` currently. Any one of them may not be populated at any given time.
* When using a lookup in an editor on an Item sheet
  * `actor` refers to the Actor where this Item is embedded, or in the case of items from compendia or the sidebar where they aren't embedded, this will be `undefined`.
  * `item` refers to the current Item being edited.
  * `target` will be a token that the viewing user has selected at the point when they process the Editor text. NOTE: this is currently just taking the list of currently selected targets and plucking the first one off, so no guarantees.
* When using a lookup in an editor on an Actor sheet
  * `actor` refers to the currently viewed Actor.
  * `item` will be `undefined`.
  * `target` is currently undefined too, but could be set up as when in the context of an Item.

For a full breakdown of the data type, see [the Data Formats page](./Data-Formats.md#enricher-data).

## Rollers

The following enrichers will output a button element that can be clicked to trigger a dice roll.

### Tests

Using the enricher data and context as above, this will produce a link that engages Cosmere RPG's core mechanic: the Skill Test roll. This is rolled for the Actor as per the data `actor` data context.

**Format**

```[[test skill=ski options]]{Override Text}```

`skill` is required and needs to be input as the trigraph identifier (e.g. "agi", "inm", etc)

*Options*
> * `attribute=att` provides an attribute override option, also passed in using the trigraph format
> * `dc=#` adds a text suffix after the button that provides the target number to be aimed for.
>   * The value for this dc can use the enricher data properties to create a calculation (see examples)
> * `defence=def` adds a text suffix after the button that details which of the target's defences should be considered for the roll's success. Also identified by trigraph.

**Examples**
|Use Case|Tag|HTML Output|
|---|---|---|
|Roll a simple skill test as the actor|`[[test skill=ath]]`|`<span class="enricher-link"><a onclick="Hooks.call('cosmere-rpg.triggerTestEnricher', "Actor.####", "Source.uuid", {"skill":"ath", "attribute":""})"><i class="fa-solid fa-dice-d20"></i>Athletics Test</a></span>`|
|Roll a skill test using a different attribute|`[[test skill=inm attribute=str]]`|`<span class="enricher-link"><a onclick="Hooks.call('cosmere-rpg.triggerTestEnricher', "Actor.####", "Source.uuid", {"skill":"inm", "attribute":"str"})"><i class="fa-solid fa-dice-d20"></i>Intimidation (Strength) Test</a></span>`|
|Roll a skill test against a set DC|`[[test skill=lor dc=11]]`|`<span class="enricher-link"><a onclick="Hooks.call('cosmere-rpg.triggerTestEnricher', "Actor.####", "Source.uuid", {"skill":"lor", "attribute":"", dc: 11})"><i class="fa-solid fa-dice-d20"></i>Lore Test</a> against DC 11</span>`|
|Roll a skill test against a calculated DC|`[[test skill=lor dc=10+@tier]]`|`<span class="enricher-link"><a onclick="Hooks.call('cosmere-rpg.triggerTestEnricher', "Actor.####", "Source.uuid", {"skill":"lor", "attribute":"", dc: 13})"><i class="fa-solid fa-dice-d20"></i>Lore Test</a> against DC 13</span>`|
|Roll a skill test against a named defence|`[[test skill=ins defence=cog]]`|`<span class="enricher-link"><a onclick="Hooks.call('cosmere-rpg.triggerTestEnricher', "Actor.####", "Source.uuid", {"skill":"ins", "attribute":""})"><i class="fa-solid fa-dice-d20"></i>Insight Test</a> against the target's Cognitive Defence</span>`|
|Didn't provide a skill|`[[test dc=11]]`|`<span>[ENRICHER ERROR - No Skill Provided]</span>`|
|Provided override text|`[[test skill=thv dc=20]]{I didn't touch nothin'!}`|`<span class="enricher-link"><a onclick="Hooks.call('cosmere-rpg.triggerTestEnricher', "Actor.####", "Source.uuid", {"skill":"thv", "attribute":"", dc: 20})"><i class="fa-solid fa-dice-d20"></i>I didn't touch nothin'!</a></span>`|

### Damage / Healing

This creates a button in the text that will roll damage dice and output a chat card with the total rolled and the various buttons to apply said damage or healing. This runs in the `actor` context.

**Format**

```[[damage formula=diceFormula type=damageType options]]{Override Text}```
```[[healing formula=diceFormula]]{Override Text}```

`formula` and `type` are required. They can include or omit their keys.
* Formula are standard formulas and can refer to any Roll Data as necessary.
* Type must be the full type name, first letter capitalised and can include healing.

*Note*: Currently multiple formulas can be included to increase the pool, but multiple damage types aren't yet fully supported, instead it will just use the first defined type. Also multiple dice pools aren't consolidated even if they are of the same die size.

*Options*
> * `healing` | `heal` - can be used as attributes rather than types or by using them as keys to a boolean value, this will swap the function over to the healing mode and output a healing card. same as using the "healing" tag-name.
> * `average` | `setValue`- average is a attribute flag that will provide a primary button that doesn't roll the dice but sends the average value for the pool. setValue does the same with an arbitrary value you set (e.g. setValue=10). Both of these still create a secondary button to roll the pool optionally.

**Examples**
|Use Case|Tag|HTML Output|
|---|---|---|
|Basic damage button|`[[damage 2d8 Vital]]` <br/> `[[damage formula=2d8 type=Vital]]`|`<span class="enricher-link"><a onclick="Hooks.call('cosmere-rpg.triggerDamageEnricher', "Actor.####", "Source.uuid", {"formula":"2d8", "damageType":"vital"})"><i class="fa-solid fa-dice-d20"></i>2d8 Vital</a> damage</span>`|
|Basic healing button|`[[healing 2d8]]` <br/> `[[damage 2d8 healing=true]]` <br/> `[[damage 2d8 heal]]` |`<span class="enricher-link"><a onclick="Hooks.call('cosmere-rpg.triggerDamageEnricher', "Actor.####", "Source.uuid", {"formula":"2d8", "damageType":"heal", "healing":true})"><i class="fa-solid fa-dice-d20"></i>2d8 Healing</a></span>`|
|Damage based on stats|`[[damage formula=1d10+@attr.spd Keen]]`|`<span class="enricher-link"><a onclick="Hooks.call('cosmere-rpg.triggerDamageEnricher', "Actor.####", "Source.uuid", {"formula":"1d10+3", "damageType":"keen"})"><i class="fa-solid fa-dice-d20"></i>1d10 + 3 Keen</a> damage</span>`|
|Using Average damage|`[[damage 1d12 type=Keen average]]`|`<span class="enricher-link"><a onclick="Hooks.call('cosmere-rpg.triggerDamageEnricher', "Actor.####", "Source.uuid", {"formula": "6", "damageType":"keen"})"><i class="fa-solid fa-dice-d20"></i>6</a> <a onclick="Hooks.call('cosmere-rpg.triggerDamageEnricher', "Actor.####", "Source.uuid", {"formula": "1d12", "damageType":"keen"})"><i class="fa-solid fa-dice-d20"></i>(1d12) Keen</a> damage</span>`|
|Using set damage value|`[[damage 1d2 type=Impact setValue=10]]`|`<span class="enricher-link"><a onclick="Hooks.call('cosmere-rpg.triggerDamageEnricher', "Actor.####", "Source.uuid", {"formula": "10", "damageType":"impact"})"><i class="fa-solid fa-dice-d20"></i>10</a> <a onclick="Hooks.call('cosmere-rpg.triggerDamageEnricher', "Actor.####", "Source.uuid", {"formula": "1d2", "damageType":"impact"})"><i class="fa-solid fa-dice-d20"></i>(1d2) Impact</a> damage</span>`|
|Didn't provide a formula|`[[damage Impact]]`|`<span>[ENRICHER ERROR - No Formula or Dice Terms Provided]</span>`|
|Didn't provide a damage type|`[[damage 2d6]]`|`<span>[ENRICHER ERROR - No Damage Type Provided]</span>`|
|Provided override text|`[[damage 1 Vital]]{Feel The Burn!}`|`<span class="enricher-link"><a onclick="Hooks.call('cosmere-rpg.triggerDamageEnricher', "Actor.####", "Source.uuid", {"formula":"1", "damageType":"vital"})"><i class="fa-solid fa-dice-d20"></i>Feel the Burn!</a></span>`|

**Options**

## Errors

Error handling has tried to be standardised as much as possible. If the tag itself cannot be parsed due to a typo in the tag name or bad syntax then we let the general prosemirror fail state take over, as the regex will not match and it will return null, so the Editor will leave the tag text unchanged.

As long as the tag can be parsed however, the enrichers should be doing their best to return a useful element or use the common error pattern when a critical failure happens.

The critical failure message is as such: `[ENRICHER ERROR - <specific error string>]`. If you see this, then likely you missed a required parameter or tried to access data that doesn't exist and can't be worked around. Usually the specific messaged will point you to how to fix it.

## Localisation

A quick note on localisation:

While the enricher tags themselves are not currently localised in any way, nearly all the output text is. While I have used english examples in this document, it would have been too unwieldy to explicitly point out which exact strings would get localised.

If you are looking to try and follow what a translated lookup should be outputting then most of the strings should be easy to find in the localisation json, under either the `GENERIC` or `ENRICHERS` top level keys.

## Work In Progress

These are just the our initial passes at these enrichers. There are whole new ideas that we have planned already and some enhancements in mind for these existing options. However if you have any suggestions or brainwaves, we'd love to hear them, please contact us in our discord! 😃