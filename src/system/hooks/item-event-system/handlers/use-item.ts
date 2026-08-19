import { CosmereItem } from '@system/documents/item';
import { HandlerType, Event } from '@system/types/item/event-system';
import { AdvantageMode, CosmereSkillRollOptions } from '@src/system/dice';

// Utils
import { matchDocuments } from '@system/utils/match-document';

// Fields
import { MatchDocumentField } from '@system/data/fields/match-document-field';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

const SCHEMA = {
    matchDocument: new MatchDocumentField({
        type: 'Item',
        required: true,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.AddActions}.Target.Label`,
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
    raiseStakes: new foundry.data.fields.BooleanField({
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
} as const;

type UseItemHandlerConfigData = foundry.data.fields.SchemaField.InitializedData<
    typeof SCHEMA
> & {
    matchDocument: MatchDocumentField.InitializedType;
};

export function register() {
    cosmereRPG.api.registerItemEventHandlerType({
        source: SYSTEM_ID,
        type: HandlerType.UseItem,
        label: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.Title`,
        description: `COSMERE.Item.EventSystem.Event.Handler.Types.${HandlerType.UseItem}.Description`,
        config: {
            schema: SCHEMA,
            template: `${TEMPLATES.DIRECTORY}${TEMPLATES.IES_HANDLER_USE_ITEM}`,
        },
        executor: async function (
            this: UseItemHandlerConfigData,
            event: Event.UseItem,
        ) {
            // Get matched items
            const items = (
                await matchDocuments({
                    ...this.matchDocument,
                    relativeTo: event.item,
                })
            ).filter((doc) => doc instanceof CosmereItem);
            if (items.length === 0) return;

            const actions = items
                .map((item) => (item.isAction() ? item : item.defaultAction))
                .filter((action) => !!action);

            const configure =
                !this.fastForward || (event.options?.configure ?? true);

            const advantageMode =
                this.advantageMode && this.advantageMode !== AdvantageMode.None
                    ? this.advantageMode
                    : ((event.options as CosmereSkillRollOptions)
                          ?.advantageMode ?? AdvantageMode.None);

            const raiseStakes =
                this.raiseStakes ||
                !!(event.options as CosmereSkillRollOptions)?.raiseStakes;

            await Promise.all(
                actions.map((action) =>
                    action.use({
                        configure,
                        advantageMode,
                        raiseStakes,
                        temporaryModifiers: this.temporaryModifiers,

                        ...(action.hasDamage()
                            ? {
                                  damage: {
                                      overrideFormula: [
                                          action.system.damage.formula ?? '',
                                          this.temporaryDamageModifiers,
                                      ]
                                          .filter((v) => !!v)
                                          .join(' + '),
                                  },
                              }
                            : {}),

                        ...event.op,
                    } as CosmereSkillRollOptions),
                ),
            );
        },
    });
}
