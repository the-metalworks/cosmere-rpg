import { register as registerGrantItemsHandler } from './grant-items';
import { register as registerExecuteMacroHandler } from './execute-macro';

export function registerHandlers() {
    registerGrantItemsHandler();
    registerExecuteMacroHandler();
}
