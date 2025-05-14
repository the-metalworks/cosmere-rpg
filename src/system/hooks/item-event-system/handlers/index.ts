import { register as registerGrantItemsHandler } from './grant-items';
import { register as registerRemoveItemsHandler } from './remove-items';
import { register as registerModifyAttributeHandler } from './modify-attribute';
import { register as registerSetAttributeHandler } from './set-attribute';
import { register as registerExecuteMacroHandler } from './execute-macro';

export function registerHandlers() {
    registerGrantItemsHandler();
    registerRemoveItemsHandler();
    registerModifyAttributeHandler();
    registerSetAttributeHandler();
    registerExecuteMacroHandler();
}
