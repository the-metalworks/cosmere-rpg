import { ArmorTraitId, WeaponTraitId } from '@system/types/cosmere';
import { ConstructorOf } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheet, BaseItemSheetRenderContext } from '../base';

export class DetailsEquipComponent extends HandlebarsApplicationComponent<
    ConstructorOf<BaseItemSheet>
> {
    static TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_DETAILS_EQUIP}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static ACTIONS = {
        'toggle-traits-collapsed':
            DetailsEquipComponent.onToggleTraitsCollapsed,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    private normalTraitsCollapsed = true;
    private expertTraitsCollapsed = true;

    /* --- Actions --- */

    private static onToggleTraitsCollapsed(
        this: DetailsEquipComponent,
        event: Event,
    ) {
        const target = event.currentTarget as HTMLElement;

        switch (target.dataset.trait) {
            case 'normal':
                this.normalTraitsCollapsed = !this.normalTraitsCollapsed;
                break;
            case 'expert':
                this.expertTraitsCollapsed = !this.expertTraitsCollapsed;
                break;
            default:
                break;
        }
    }

    /* --- Context --- */

    public _prepareContext(params: never, context: BaseItemSheetRenderContext) {
        const isEquippable = this.application.item.isEquippable();

        if (!isEquippable) {
            return Promise.resolve({
                ...context,
                isEquippable,
            });
        }

        return Promise.resolve({
            ...context,
            isEquippable,
            equipTypes: Object.entries(CONFIG.COSMERE.items.equip.types).reduce(
                (acc, [key, type]) => ({
                    ...acc,
                    [key]: type.label,
                }),
                {},
            ),
            holdTypeLabel: this.application.item.system.equip.hold
                ? CONFIG.COSMERE.items.equip.hold[
                      this.application.item.system.equip.hold
                  ].label
                : '—',
            normalTraitsCollapsed: this.normalTraitsCollapsed,
            expertTraitsCollapsed: this.expertTraitsCollapsed,
            normalTraits: this.prepareTraitsData(false),
            expertTraits: this.prepareTraitsData(true),
            normalTraitsString: this.prepareNormalTraitsString(),
            expertTraitsString: this.prepareExpertTraitsString(),
        });
    }

    private prepareTraitsData(expert: boolean) {
        const item = this.application.item;

        if (!item.isArmor() && !item.isWeapon()) return null;

        const isArmor = item.isArmor();

        return Object.entries(
            isArmor
                ? CONFIG.COSMERE.traits.armorTraits
                : CONFIG.COSMERE.traits.weaponTraits,
        )
            .map(([id, config]) => {
                // Look up trait
                const traitData = isArmor
                    ? item.system.traits[id as ArmorTraitId]
                    : item.system.traits[id as WeaponTraitId];

                if (!expert) {
                    return {
                        id,
                        label: config.label,
                        hasValue: config.hasValue ?? false,
                        active: traitData?.defaultActive,
                        value: traitData?.defaultValue,
                    };
                }

                if (traitData?.defaultActive) {
                    return [
                        ...(config.hasValue
                            ? [
                                  {
                                      id,
                                      type: 'modify-trait-value',
                                      label: game
                                          .i18n!.localize(
                                              'COSMERE.Item.Sheet.Equip.ModifyTraitValue',
                                          )
                                          .replace(
                                              '[trait]',
                                              game.i18n!.localize(config.label),
                                          )
                                          .replace(
                                              '[value]',
                                              (
                                                  traitData.defaultValue ?? 0
                                              ).toString(),
                                          ),
                                      value:
                                          traitData.expertise.value ??
                                          traitData.defaultValue,
                                      active: !!traitData.expertise.value,
                                  },
                              ]
                            : []),

                        {
                            id,
                            type: 'lose-trait',
                            label: game
                                .i18n!.localize(
                                    'COSMERE.Item.Sheet.Equip.LoseTrait',
                                )
                                .replace(
                                    '[trait]',
                                    game.i18n!.localize(config.label),
                                ),
                            active: traitData.expertise.toggleActive,
                        },
                    ];
                } else {
                    return [
                        {
                            id,
                            type: 'gain-trait',
                            label: config.label,
                            active: traitData?.expertise.toggleActive,
                            value: traitData?.defaultValue,
                        },
                    ];
                }
            })
            .flat();
    }

    private prepareNormalTraitsString() {
        const item = this.application.item;
        if (!item.hasTraits()) return null;

        const isArmor = item.isArmor();

        return item.system.traitsArray
            .filter((trait) => trait.defaultActive)
            .map((trait) => {
                const config = isArmor
                    ? CONFIG.COSMERE.traits.armorTraits[
                          trait.id as ArmorTraitId
                      ]
                    : CONFIG.COSMERE.traits.weaponTraits[
                          trait.id as WeaponTraitId
                      ];

                return game.i18n!.localize(config.label);
            })
            .join(', ');
    }

    private prepareExpertTraitsString() {
        const item = this.application.item;
        if (!item.hasTraits()) return null;

        const isArmor = item.isArmor();

        return item.system.traitsArray
            .filter(
                (trait) =>
                    !!trait.expertise.toggleActive ||
                    trait.expertise.value !== null,
            )
            .map((trait) => {
                const config = isArmor
                    ? CONFIG.COSMERE.traits.armorTraits[
                          trait.id as ArmorTraitId
                      ]
                    : CONFIG.COSMERE.traits.weaponTraits[
                          trait.id as WeaponTraitId
                      ];

                if (trait.defaultActive && trait.expertise.toggleActive) {
                    return game
                        .i18n!.localize('COSMERE.Item.Sheet.Equip.LoseTrait')
                        .replace('[trait]', game.i18n!.localize(config.label));
                } else if (
                    !trait.defaultActive &&
                    trait.expertise.toggleActive
                ) {
                    return game.i18n!.localize(config.label);
                } else if (
                    trait.defaultValue !== null &&
                    trait.expertise.value !== null
                ) {
                    return game
                        .i18n!.localize(
                            'COSMERE.Item.Sheet.Equip.ModifyTraitValue',
                        )
                        .replace('[trait]', game.i18n!.localize(config.label))
                        .replace('[value]', trait.defaultValue!.toString())
                        .replace(
                            '[newValue]',
                            trait.expertise.value!.toString(),
                        );
                }
            })
            .join(', ');
    }
}

// Register the component
DetailsEquipComponent.register('app-item-details-equip');
