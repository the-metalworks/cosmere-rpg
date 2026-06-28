import { register as registerGrantItemsHandler } from './grant-items';
import { register as registerRemoveItemsHandler } from './remove-items';
import { register as registerModifyAttributeHandler } from './modify-attribute';
import { register as registerSetAttributeHandler } from './set-attribute';
import { register as registerModifySkillRankHandler } from './modify-skill-rank';
import { register as registerSetSkillRankHandler } from './set-skill-rank';
import { register as registerGrantExpertisesHandler } from './grant-expertises';
import { register as registerRemoveExpertisesHandler } from './remove-expertises';
import { register as registerUseItemHandler } from './use-item';
import { register as registerUpdateItemHandler } from './update-item';
import { register as registerUpdateActorHandler } from './update-actor';
import { register as registerExecuteMacroHandler } from './execute-macro';
import { register as registerAddActionsHandler } from './add-actions';
import { register as registerRemoveActionsHandler } from './remove-actions';

export function registerHandlers() {
    registerGrantItemsHandler();
    registerRemoveItemsHandler();
    registerAddActionsHandler();
    registerRemoveActionsHandler();
    registerUseItemHandler();
    registerUpdateItemHandler();
    registerModifyAttributeHandler();
    registerSetAttributeHandler();
    registerModifySkillRankHandler();
    registerSetSkillRankHandler();
    registerGrantExpertisesHandler();
    registerRemoveExpertisesHandler();
    registerUpdateActorHandler();
    registerExecuteMacroHandler();
}
