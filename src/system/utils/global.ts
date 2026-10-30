import { invokeMigration } from './migration';
import { getObjectChanges } from './data';
import * as macros from './macros';
import AdvancementManager from './advancement';

/**
 * Global utility functions, exposed to users via
 * cosmereRPG.utils
 */

export default {
    invokeMigration,
    macros,
    getObjectChanges,
    AdvancementManager,
};
