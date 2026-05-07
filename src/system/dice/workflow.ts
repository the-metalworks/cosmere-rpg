import { RollConfigurationDialog } from '../applications/dialogs/roll-configuration';
import { CosmereRoll, CosmereRollOptions } from './rolls/cosmere-roll';
import { RollEvaluationOptions } from './types';

export async function executeRolls(
    rolls: CosmereRoll[],
    options: CosmereRollOptions,
) {
    if (rolls.length === 0) return [];

    const config = options.configure
        ? await configureRolls(rolls, options)
        : { rolls, options };

    if (!config) return [];

    const evaluated = await evaluateRolls(config.rolls, config.options);

    if (config.options.chatMessage ?? true) {
        await outputRolls(evaluated, config.options);
    }

    return evaluated;
}

async function configureRolls(
    rolls: CosmereRoll[],
    options: CosmereRollOptions,
) {
    const preps: Promise<CosmereRoll>[] = [];
    rolls.forEach((r) =>
        preps.push(r.prepare(options as RollEvaluationOptions)),
    );
    await Promise.all(preps);

    // Show the dialog
    const result = await RollConfigurationDialog.show({
        title:
            options.title ??
            game.i18n.localize('DIALOG.ConfigureRolls.Default'),
        rolls,
        options,
    });

    if (!result) return undefined;

    return result;
}

async function evaluateRolls(
    rolls: CosmereRoll[],
    options: CosmereRollOptions,
) {
    const evals: Promise<CosmereRoll>[] = [];
    rolls.forEach((r) =>
        evals.push(r.evaluate(options as RollEvaluationOptions)),
    );
    await Promise.all(evals);

    return rolls;
}

async function outputRolls(rolls: CosmereRoll[], options: CosmereRollOptions) {
    const messageData = {
        author: game.user.id,
        speaker: options.speaker,
        rolls,
        system: {
            targets: rolls[0]?.data.targets,
            description: await rolls[0]?.data.description,
        },
    };

    const messageOptions = {
        rollMode: options.rollMode,
    };

    const message = await ChatMessage.create(messageData, messageOptions);

    return message;
}
