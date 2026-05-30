import type {
    ItemResource,
    ItemResourceRechargeType,
} from '@system/types/cosmere';
import { NONE } from '@system/types/utils';

// Component imports
import { HandlebarsApplicationComponent } from '@system/applications/component-system';
import { BaseItemSheet, BaseItemSheetRenderContext } from '../base';

// Constants
import { SYSTEM_ID } from '@system/constants';
import { TEMPLATES } from '@system/utils/templates';

export class DetailsResourcesComponent extends HandlebarsApplicationComponent<
    //@ts-expect-error Workaround for foundry-vtt-types issues
    typeof BaseItemSheet
> {
    static readonly TEMPLATE = `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_DETAILS_RESOURCES}`;

    /**
     * NOTE: Unbound methods is the standard for defining actions and forms
     * within ApplicationV2
     */
    /* eslint-disable @typescript-eslint/unbound-method */
    static readonly ACTIONS = {
        'delete-resource': DetailsResourcesComponent.onDeleteResource,
    };
    /* eslint-enable @typescript-eslint/unbound-method */

    /* --- Handlers --- */

    private static _onAddResource(
        this: DetailsResourcesComponent,
        event: Event,
    ) {
        if (!this.application.item.hasResources()) return;
        if (!(event.target instanceof HTMLSelectElement)) return;

        const id = event.target.value as ItemResource;

        // If the resource being added is the first resource, set it as the primary resource
        const primaryResource =
            this.application.item.system.primaryResource === NONE
                ? id
                : this.application.item.system.primaryResource;

        // Add the resource to the item
        void this.application.item.update({
            system: {
                primaryResource,
                resources: {
                    [id]: {
                        value: 1,
                        max: 1,
                        recharge: NONE,
                    },
                },
            },
        });
    }

    private static onDeleteResource(
        this: DetailsResourcesComponent,
        event: Event,
    ) {
        if (!this.application.item.hasResources()) return;
        if (!(event.target instanceof HTMLElement)) return;

        const id = event.target.closest('[data-id]')?.getAttribute('data-id');
        if (!id || !(id in this.application.item.system.resources)) return;

        // If the resource being deleted is the primary resource, fallback to the next available resource or NONE if no resources remain
        const primaryResource =
            this.application.item.system.primaryResource === id
                ? (Object.values(this.application.item.system.resources)
                      .filter((r) => !!r)
                      .find((r) => r.key !== id)?.key ?? NONE)
                : this.application.item.system.primaryResource;

        // Remove the resource from the item
        void this.application.item.update({
            system: {
                primaryResource,
                resources: {
                    [id]: null,
                },
            },
        });
    }

    private static _onValueChange(
        this: DetailsResourcesComponent,
        event: Event,
    ) {
        if (!this.application.item.hasResources()) return;
        if (!(event.target instanceof HTMLInputElement)) return;

        const resourceId = event.target
            .closest('[data-id]')
            ?.getAttribute('data-id');
        if (
            !resourceId ||
            !(resourceId in this.application.item.system.resources)
        )
            return;

        const resource =
            this.application.item.system.resources[resourceId as ItemResource];
        if (!resource) return;

        const value = Number(event.target.value);
        if (isNaN(value) || value < 0) return;

        if (value > resource.max) {
            void this.application.item.update({
                system: {
                    resources: {
                        [resourceId]: {
                            max: value,
                        },
                    },
                },
            });
        }
    }

    private static _onMaxChange(this: DetailsResourcesComponent, event: Event) {
        if (!this.application.item.hasResources()) return;
        if (!(event.target instanceof HTMLInputElement)) return;

        const resourceId = event.target
            .closest('[data-id]')
            ?.getAttribute('data-id');
        if (
            !resourceId ||
            !(resourceId in this.application.item.system.resources)
        )
            return;

        const resource =
            this.application.item.system.resources[resourceId as ItemResource];
        if (!resource) return;

        const max = Number(event.target.value);
        if (isNaN(max) || max < 1) return;

        if (max < resource.value) {
            void this.application.item.update({
                system: {
                    resources: {
                        [resourceId]: {
                            value: max,
                        },
                    },
                },
            });
        }
    }

    /* --- Lifecycle --- */

    public _onRender(params: never): void {
        super._onRender(params);

        this.element
            ?.querySelector('select[name="new-resource"]')
            ?.addEventListener(
                'change',
                DetailsResourcesComponent._onAddResource.bind(this),
            );

        this.element
            ?.querySelectorAll('input[type="number"][name$=".value"]')
            .forEach((input) =>
                input.addEventListener(
                    'change',
                    DetailsResourcesComponent._onValueChange.bind(this),
                ),
            );

        this.element
            ?.querySelectorAll('input[type="number"][name$=".max"]')
            .forEach((input) =>
                input.addEventListener(
                    'change',
                    DetailsResourcesComponent._onMaxChange.bind(this),
                ),
            );
    }

    /* --- Context --- */

    public _prepareContext(params: never, context: BaseItemSheetRenderContext) {
        const item = this.application.item;
        if (!item.hasResources()) {
            return Promise.resolve({
                ...context,
                hasResources: false,
            });
        }

        const resources = Object.values(item.system.resources)
            .filter((v) => !!v)
            .map((resource) => ({
                ...resource,
                label: CONFIG.COSMERE.item.resource.types[resource.key]
                    .labelPlural,
            }));

        const primaryResourceSelectOptions = resources.reduce(
            (acc, resource) => ({
                ...acc,
                [resource.key]: resource.label,
            }),
            {} as Record<string, string>,
        );

        const availableResources = Object.entries(
            CONFIG.COSMERE.item.resource.types,
        )
            .filter(([key]) => !resources.some((r) => r.key === key))
            .reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.labelPlural,
                }),
                {} as Record<string, string>,
            );

        return Promise.resolve({
            ...context,
            hasResources: true,
            resources,
            availableResources,
            primaryResourceSelectOptions,
        });
    }
}

// Register the component
DetailsResourcesComponent.register('app-item-details-resources');
