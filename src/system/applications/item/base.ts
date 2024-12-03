import { ArmorTraitId, Skill, WeaponTraitId } from '@system/types/cosmere';
import { CosmereItem } from '@system/documents/item';
import { DeepPartial, AnyObject } from '@system/types/utils';

// Mixins
import { ComponentHandlebarsApplicationMixin } from '@system/applications/component-system';
import { TabsApplicationMixin } from '@system/applications/mixins';
import { getSystemSetting, SETTINGS } from '@src/system/settings';

const { ItemSheetV2 } = foundry.applications.sheets;

export interface BaseItemSheetRenderContext {
    item: CosmereItem;
}

export class BaseItemSheet extends TabsApplicationMixin(
    ComponentHandlebarsApplicationMixin(ItemSheetV2),
)<AnyObject> {
    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            form: {
                handler: this.onFormEvent,
                submitOnChange: true,
            } as unknown,
        },
    );
    /* eslint-enable @typescript-eslint/unbound-method */

    static TABS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.TABS),
        {
            description: {
                label: 'COSMERE.Item.Sheet.Tabs.Description',
                icon: '<i class="fa-solid fa-feather-pointed"></i>',
            },
            effects: {
                label: 'COSMERE.Item.Sheet.Tabs.Effects',
                icon: '<i class="fa-solid fa-bolt"></i>',
            },
        },
    );

    get item(): CosmereItem {
        return super.document;
    }

    /* --- Form --- */

    protected static onFormEvent(
        this: BaseItemSheet,
        event: Event,
        form: HTMLFormElement,
        formData: FormDataExtended,
    ) {
        if (event instanceof SubmitEvent) return;
        if (!('name' in event.target!)) return;

        if (this.item.isPhysical() && 'system.price.unit' in formData.object) {
            // Get currency id
            const [currencyId, denominationId] = (
                formData.object['system.price.unit'] as string
            ).split('.');

            // Remove the unit
            formData.delete('system.price.unit');

            // Get the currency
            const currency = CONFIG.COSMERE.currencies[currencyId];

            formData.set(
                'system.price.currency',
                currency ? currencyId : 'none',
            );

            if (currency) {
                // Get the primary denomination
                const primaryDenomination = currency.denominations.primary.find(
                    (denomination) => denomination.id === denominationId,
                );

                formData.set(
                    'system.price.denomination.primary',
                    primaryDenomination?.id ?? 'none',
                );
            }
        }

        if (this.item.hasActivation()) {
            if (
                'system.activation.cost.type' in formData.object &&
                formData.object['system.activation.cost.type'] === 'none'
            )
                formData.set('system.activation.cost.type', null);

            if (
                'system.activation.consume.type' in formData.object &&
                formData.object['system.activation.consume.type'] === 'none'
            )
                formData.set('system.activation.consume', null);

            if (
                'system.activation.consume.resource' in formData.object &&
                formData.object['system.activation.consume.resource'] === 'none'
            )
                formData.set('system.activation.consume.resource', null);

            if (
                'system.activation.skill' in formData.object &&
                formData.object['system.activation.skill'] === 'none'
            )
                formData.set('system.activation.skill', null);

            if (
                'system.activation.attribute' in formData.object &&
                formData.object['system.activation.attribute'] === 'default'
            ) {
                formData.set(
                    'system.activation.attribute',
                    CONFIG.COSMERE.skills[
                        formData.object['system.activation.skill'] as Skill
                    ].attribute,
                );
            }
            if (
                'system.activation.attribute' in formData.object &&
                formData.object['system.activation.attribute'] === 'none'
            )
                formData.set('system.activation.attribute', null);

            if (
                'system.activation.uses.type' in formData.object &&
                formData.object['system.activation.uses.type'] === 'none'
            )
                formData.set('system.activation.uses', null);

            if (
                'system.activation.uses.recharge' in formData.object &&
                formData.object['system.activation.uses.recharge'] === 'none'
            )
                formData.set('system.activation.uses.recharge', null);
        }

        if (this.item.hasDamage()) {
            if (
                'system.damage.formula' in formData.object &&
                (formData.object['system.damage.formula'] as string).trim() ===
                    ''
            )
                formData.set('system.damage.formula', null);

            if (
                'system.damage.type' in formData.object &&
                formData.object['system.damage.type'] === 'none'
            )
                formData.set('system.damage.type', null);

            if (
                'system.damage.skill' in formData.object &&
                formData.object['system.damage.skill'] === 'none'
            )
                formData.set('system.damage.skill', null);

            if (
                'system.damage.attribute' in formData.object &&
                formData.object['system.damage.attribute'] === 'none'
            )
                formData.set('system.damage.attribute', null);
        }

        if (this.item.hasAttack()) {
            if (
                'system.attack.range.unit' in formData.object &&
                formData.object['system.attack.range.unit'] === 'none'
            )
                formData.set('system.attack.range', null);
        }

        if (this.item.hasTraits()) {
            const item = this.item;
            const object = formData.object as Record<
                string,
                string | number | boolean
            >;

            const traitsData = Object.entries(object).filter(([key]) =>
                key.startsWith('system.traits'),
            );

            const defaultValueTraitsData = traitsData.filter(([key]) =>
                key.endsWith('.defaultValue'),
            ) as [string, number][];

            defaultValueTraitsData.forEach(([key, defaultValue]) => {
                if (!defaultValue) {
                    formData.set(key, 0);
                }
            });

            const expertModifyValueTraitsData = traitsData.filter(([key]) =>
                key.endsWith('.expertise.modifyValue'),
            ) as [string, boolean][];

            expertModifyValueTraitsData.forEach(([key, modifiesValue]) => {
                // Get trait id
                const traitId = key
                    .replace('system.traits.', '')
                    .replace('.expertise.modifyValue', '') as
                    | ArmorTraitId
                    | WeaponTraitId;

                // Get the trait
                const trait = item.system.traits[traitId];

                if (modifiesValue) {
                    if (!trait.expertise?.value) {
                        // Get value
                        const value = trait.defaultValue!;
                        formData.set(
                            `system.traits.${traitId}.expertise.value`,
                            value,
                        );
                        formData.set(
                            `system.traits.${traitId}.expertise.toggleActive`,
                            false,
                        );
                    } else if (
                        object[
                            `system.traits.${traitId}.expertise.toggleActive`
                        ]
                    ) {
                        // Remove value
                        formData.set(
                            `system.traits.${traitId}.expertise.value`,
                            null,
                        );
                    }
                } else {
                    formData.set(
                        `system.traits.${traitId}.expertise.value`,
                        null,
                    );
                }

                // Remove modifyValue
                formData.delete(key);
            });
        }

        if (this.item.hasModality()) {
            // Get modality enabled
            const modalityEnabled = formData.get('modalityEnabled') === 'true';

            // Set modality
            if (modalityEnabled && this.item.system.modality === null) {
                formData.set('system.modality', '<id>');
            } else if (!modalityEnabled && this.item.system.modality !== null) {
                formData.set('system.modality', null);
            }

            // Remove modality enabled
            formData.delete('modalityEnabled');
        }

        // Update the document
        void this.item.update(formData.object);
    }

    /* --- Context --- */

    public async _prepareContext(
        options: DeepPartial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        let enrichedDescValue = undefined;
        if (this.item.hasDescription()) {
            if (
                this.item.system.description!.value ===
                CONFIG.COSMERE.items.types[this.item.type].desc_placeholder
            ) {
                this.item.system.description!.value = game.i18n!.localize(
                    this.item.system.description!.value!,
                );
            }
            enrichedDescValue = await TextEditor.enrichHTML(
                this.item.system.description!.value!,
            );
        }
        return {
            ...(await super._prepareContext(options)),
            item: this.item,
            systemFields: (
                this.item.system.schema as foundry.data.fields.SchemaField
            ).fields,
            editable: this.isEditable,
            descHtml: enrichedDescValue,
            sideTabs: getSystemSetting(SETTINGS.ITEM_SHEET_SIDE_TABS),
        };
    }
}
