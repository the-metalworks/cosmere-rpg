import { ConstructorOf } from '@system/types/utils';

import { SYSTEM_ID } from '@system/constants';

export type SheetMode = 'view' | 'edit';

/**
 * Mixin that adds an edit mode to an ApplicationV2
 */
export function EditModeApplicationMixin<
    T extends ConstructorOf<
        // NOTE: Use of any as the mixin doesn't care about the types
        // and we don't want to interfere with the final type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        foundry.applications.api.DocumentSheetV2<any, any, any, any>
    >,
>(base: T) {
    return class mixin extends base {
        /* --- Accessors --- */

        public get mode(): SheetMode {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            return this.document.getFlag(SYSTEM_ID, 'sheet.mode') ?? 'view';
        }

        public get isEditMode(): boolean {
            return this.mode === 'edit' && this.isEditable;
        }

        /* --- Public Functions --- */

        public async setMode(mode: SheetMode) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            await this.document.setFlag(SYSTEM_ID, 'sheet.mode', mode);

            // Get toggle
            const toggle = $(this.element).find('#mode-toggle');

            // Update checked status
            toggle.find('input').prop('checked', this.mode === 'edit');

            // Set mode class
            $(this.element)
                .removeClass(`mode-${mode === 'view' ? 'edit' : 'view'}`)
                .addClass(`mode-${mode}`);

            // Call mode change event
            this._onModeChange();
        }

        /* --- Lifecycle --- */

        protected async _renderFrame(
            options: Partial<foundry.applications.api.ApplicationV2.RenderOptions>,
        ): Promise<HTMLElement> {
            const frame = await super._renderFrame(options);

            // Insert mode toggle
            if (this.isEditable) {
                $(this.window.title!).before(`
                    <label id="mode-toggle" 
                        class="toggle-switch"
                    >
                        <input type="checkbox" ${this.mode === 'edit' ? 'checked' : ''}>
                        <div class="slider rounded">
                            <i class="fa-solid fa-pen"></i>
                        </div>
                    </label>
                `);

                $(this.window.header!)
                    .find('#mode-toggle')
                    .on('click', this.onToggleMode.bind(this));
            }

            // Set mode class
            $(frame).addClass(`mode-${this.mode}`);

            return frame;
        }

        /* --- Handlers --- */

        private async onToggleMode(event: Event) {
            if (!(event.target instanceof HTMLInputElement)) return;

            event.preventDefault();
            event.stopPropagation();

            // Toggle mode
            await this.setMode(this.mode === 'view' ? 'edit' : 'view');
        }

        /* --- Lifecylce events --- */

        /**
         * Gets called after the mode has been changed
         */
        protected _onModeChange() {}
    };
}
