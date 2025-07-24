import { ConstructorOf, AnyObject, EmptyObject } from '@system/types/utils';

export type ApplicationV2Constructor<
    RenderContext extends AnyObject = EmptyObject,
    Configuration extends
        foundry.applications.api.ApplicationV2.Configuration = foundry.applications.api.ApplicationV2.Configuration,
    RenderOptions extends
        foundry.applications.api.ApplicationV2.RenderOptions = foundry.applications.api.ApplicationV2.RenderOptions,
> = ConstructorOf<
    foundry.applications.api.ApplicationV2<
        RenderContext,
        Configuration,
        RenderOptions
    >
>;

export type ComponentActionHandler =
    | foundry.applications.api.ApplicationV2.ClickAction
    | {
          handler: foundry.applications.api.ApplicationV2.ClickAction;
          buttons: number[];
      };

export type ComponentEvent<T extends AnyObject> = CustomEvent<{ params: T }>;

export interface PartState {
    scrollPositions: [
        element: HTMLElement,
        scrollTop: number,
        scrollLeft: number,
    ][];
    focus?: string;
}

export interface ComponentState {
    scrollPositions: [
        selector: string,
        scrollTop: number,
        scrollLeft: number,
    ][];
    focus?: string;
}
