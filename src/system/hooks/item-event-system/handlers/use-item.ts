import { CosmereItem } from '@system/documents/item';
import { HandlerType, Event } from '@system/types/item/event-system';
import { AdvantageMode } from '@system/types/roll';

// Utils
import { ItemTarget, MatchMode, matchItems } from './utils';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

interface UseItemHandlerConfigData {
    target: ItemTarget;
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
        source: SYSTEM_ID,
        type: HandlerType.UseItem,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.Description`,
        config: {
            schema: {
                target: new foundry.data.fields.StringField({
                    choices: {
                        [ItemTarget.Self]: `COSMERE.Item.EventSystem.Event.Handler.General.Target.Choices.${ItemTarget.Self}`,
                        [ItemTarget.Sibling]: `COSMERE.Item.EventSystem.Event.Handler.General.Target.Choices.${ItemTarget.Sibling}`,
                        [ItemTarget.EquippedWeapon]: `COSMERE.Item.EventSystem.Event.Handler.General.Target.Choices.${ItemTarget.EquippedWeapon}`,
                        [ItemTarget.EquippedArmor]: `COSMERE.Item.EventSystem.Event.Handler.General.Target.Choices.${ItemTarget.EquippedArmor}`,
                        [ItemTarget.Global]: `COSMERE.Item.EventSystem.Event.Handler.General.Target.Choices.${ItemTarget.Global}`,
                    },
                    initial: ItemTarget.Sibling,
                    required: true,
                    blank: false,
                    label: `COSMERE.Item.EventSystem.Event.Handler.General.Target.Label`,
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
                        [MatchMode.Identifier]: `COSMERE.Item.EventSystem.Event.Handler.General.MatchMode.Choices.${MatchMode.Identifier}`,
                        [MatchMode.Name]: `COSMERE.Item.EventSystem.Event.Handler.General.MatchMode.Choices.${MatchMode.Name}`,
                        [MatchMode.UUID]: `COSMERE.Item.EventSystem.Event.Handler.General.MatchMode.Choices.${MatchMode.UUID}`,
                    },
                    label: `COSMERE.Item.EventSystem.Event.Handler.General.MatchMode.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.General.MatchMode.Hint`,
                }),
                matchAll: new foundry.data.fields.BooleanField({
                    initial: false,
                    nullable: true,
                    label: `COSMERE.Item.EventSystem.Event.Handler.General.MatchAll.Label`,
                    hint: `COSMERE.Item.EventSystem.Event.Handler.General.MatchAll.Hint`,
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
            if (
                !event.item.actor &&
                (this.target === ItemTarget.Sibling ||
                    this.target === ItemTarget.EquippedWeapon ||
                    this.target === ItemTarget.EquippedArmor)
            )
                return;
            if (
                !this.uuid &&
                (this.target === ItemTarget.Sibling ||
                    this.target === ItemTarget.Global)
            )
                return;
            if (this.target === ItemTarget.Self && event.type === 'use') return;

            // Get the item(s) to use
            const itemsToUse = await matchItems(
                event.item,
                this.target,
                this.uuid ?? null,
                this.matchMode ?? MatchMode.Identifier,
                this.matchAll ?? false,
            );

            const configurable =
                !this.fastForward || (event.options?.configurable ?? true);

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

                        ...event.op,
                    }),
                ),
            );
        },
    });
}
