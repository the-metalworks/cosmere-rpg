import { CosmereItem } from '@system/documents/item';
import { HandlerType, Event } from '@system/types/item/event-system';
import { AdvantageMode } from '@system/types/roll';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

const enum UseItemTarget {
    Self = 'self',
    Sibling = 'sibling',
    Global = 'global',
}

const enum MatchMode {
    Identifier = 'identifier',
    Name = 'name',
    UUID = 'uuid',
}

interface UseItemHandlerConfigData {
    target: UseItemTarget;
    uuid?: string | null;
    matchMode?: MatchMode | null;
    matchAll?: boolean | null;
    fastForward: boolean;
    advantageMode: AdvantageMode;
    plotDie: boolean;
    temporaryModifiers?: string;
    temporaryDamageModifiers?: string;
}

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        type: HandlerType.UseItem,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.Description`,
        config: {
            schema: {
                target: new foundry.data.fields.StringField({
                    choices: {
                        [UseItemTarget.Self]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.Target.Choices.${UseItemTarget.Self}`,
                        [UseItemTarget.Sibling]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.Target.Choices.${UseItemTarget.Sibling}`,
                        [UseItemTarget.Global]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.Target.Choices.${UseItemTarget.Global}`,
                    },
                    initial: UseItemTarget.Sibling,
                    required: true,
                    blank: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.Target.Label`,
                }),
                uuid: new foundry.data.fields.DocumentUUIDField({
                    type: 'Item',
                    initial: null,
                    nullable: true,
                    label: 'Item',
                }),
                matchMode: new foundry.data.fields.StringField({
                    nullable: true,
                    initial: MatchMode.Identifier,
                    choices: {
                        [MatchMode.Identifier]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.MatchMode.Choices.${MatchMode.Identifier}`,
                        [MatchMode.Name]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.MatchMode.Choices.${MatchMode.Name}`,
                        [MatchMode.UUID]: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.MatchMode.Choices.${MatchMode.UUID}`,
                    },
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.MatchMode.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.MatchMode.Hint`,
                }),
                matchAll: new foundry.data.fields.BooleanField({
                    initial: false,
                    nullable: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.MatchAll.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.MatchAll.Hint`,
                }),
                fastForward: new foundry.data.fields.BooleanField({
                    initial: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.FastForward.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.FastForward.Hint`,
                }),
                advantageMode: new foundry.data.fields.StringField({
                    initial: AdvantageMode.None,
                    choices: {
                        [AdvantageMode.None]: `DICE.AdvantageMode.None`,
                        [AdvantageMode.Advantage]: `DICE.AdvantageMode.Advantage`,
                        [AdvantageMode.Disadvantage]: `DICE.AdvantageMode.Disadvantage`,
                    },
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.AdvantageMode.Label`,
                }),
                plotDie: new foundry.data.fields.BooleanField({
                    initial: false,
                    label: 'DICE.Plot.RaiseTheStakes',
                }),
                temporaryModifiers: new foundry.data.fields.StringField({
                    initial: '',
                    label: `DICE.TemporaryBonus.Label`,
                    hint: `DICE.TemporaryBonus.Hint`,
                }),
                temporaryDamageModifiers: new foundry.data.fields.StringField({
                    initial: '',
                    label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.TemporaryDamageModifiers.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.TemporaryDamageModifiers.Hint`,
                }),
            },
            template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.IES_HANDLER_USE_ITEM}`,
        },
        executor: async function (
            this: UseItemHandlerConfigData,
            event: Event.UseItem,
        ) {
            if (this.target === UseItemTarget.Sibling && !event.item.actor)
                return;
            if (this.target !== UseItemTarget.Self && !this.uuid) return;
            if (this.target === UseItemTarget.Self && event.type === 'use')
                return;

            // Get the item(s) to use
            const itemsToUse = await getItemsToUse(
                event.item,
                this.target,
                this.uuid ?? null,
                this.matchMode ?? MatchMode.Identifier,
                this.matchAll ?? false,
            );

            const configurable = !(
                this.fastForward || event.options?.configurable
            );

            const advantageMode =
                this.advantageMode && this.advantageMode !== AdvantageMode.None
                    ? this.advantageMode
                    : (event.options?.advantageMode ?? AdvantageMode.None);

            const plotDie = this.plotDie || !!event.options?.plotDie;

            await Promise.all(
                itemsToUse.map((item) =>
                    item.use({
                        configurable,
                        advantageMode,
                        plotDie,
                        temporaryModifiers: this.temporaryModifiers,

                        ...(item.hasDamage()
                            ? {
                                  damage: {
                                      overrideFormula: [
                                          item.system.damage.formula ?? '',
                                          this.temporaryDamageModifiers,
                                      ]
                                          .filter((v) => !!v)
                                          .join(' + '),
                                  },
                              }
                            : {}),
                    }),
                ),
            );
        },
    });
}

/* --- Helpers --- */

async function getItemsToUse(
    item: CosmereItem,
    target: UseItemTarget,
    uuid: string | null,
    matchMode: MatchMode | null,
    matchAll: boolean | null,
): Promise<CosmereItem[]> {
    if (target === UseItemTarget.Self) {
        return [item];
    } else if (target === UseItemTarget.Sibling && item.actor && uuid) {
        // Look up the reference item from uuid
        const referenceItem = (await fromUuid(uuid)) as CosmereItem | null;
        if (!referenceItem) return [];

        const siblings = item.actor.items;

        // Determine the match mode
        matchMode =
            matchMode === MatchMode.Identifier && !referenceItem.hasId()
                ? MatchMode.Name
                : matchMode;

        // Get the matcher function
        const matcher =
            matchMode === MatchMode.Identifier
                ? getIdentifierMatcher(referenceItem)
                : matchMode === MatchMode.Name
                  ? getNameMatcher(referenceItem)
                  : getUUIDMatcher(referenceItem);

        // Get the items to update
        return matchAll
            ? siblings.filter(matcher)
            : [siblings.find(matcher)].filter((item) => !!item);
    } else if (target === UseItemTarget.Global && uuid) {
        // Look up the target item from uuid
        return [(await fromUuid(uuid)) as CosmereItem | null].filter(
            (item) => !!item,
        );
    } else {
        throw new Error('Invalid target');
    }
}

function getIdentifierMatcher(referenceItem: CosmereItem) {
    return (item: CosmereItem) =>
        item.hasId() && item.system.id === referenceItem.system.id;
}

function getNameMatcher(referenceItem: CosmereItem) {
    return (item: CosmereItem) => item.name === referenceItem.name;
}

function getUUIDMatcher(referenceItem: CosmereItem) {
    return (item: CosmereItem) => item.uuid === referenceItem.uuid;
}
