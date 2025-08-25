import { AnyObject } from '@system/types/utils';

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
