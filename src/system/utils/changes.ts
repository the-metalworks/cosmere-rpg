import { ChangeData } from '@system/data/item/misc/change';
import { AnyObject } from '@system/types/utils';

interface IRollable {
    getRollData(): object;
}

export function tryApplyRollData<T extends ChangeData>(
    source: IRollable,
    change: T,
): T;
export function tryApplyRollData<T extends ChangeData>(
    data: AnyObject,
    change: T,
): T;
export function tryApplyRollData(source: IRollable, value: string): string;
export function tryApplyRollData(data: AnyObject, value: string): string;
export function tryApplyRollData(
    source: IRollable | AnyObject,
    changeOrValue: ChangeData | string,
): ChangeData | string {
    const rollData =
        'getRollData' in source
            ? ((source as IRollable).getRollData() as AnyObject)
            : source;

    if (typeof changeOrValue === 'object') {
        const value = changeOrValue.value;
        return {
            ...changeOrValue,
            value: tryApplyRollData(rollData, value),
        };
    } else {
        try {
            // Treat the change value as a formula and evaluate it
            return new Roll(changeOrValue, rollData)
                .evaluateSync()
                .total.toString();
        } catch {
            return changeOrValue;
        }
    }
}

export function getChangeValue(change: ChangeData, source: object) {
    // Get the current value
    const currentValue = foundry.utils.getProperty(
        source,
        change.key,
    ) as unknown;
    const valueType = foundry.utils.getType(currentValue);

    switch (change.mode) {
        case CONST.ACTIVE_EFFECT_MODES.ADD:
            return valueType === 'number'
                ? (currentValue as number) + tryParseNumber(change.value)
                : valueType === 'string'
                  ? (currentValue as string) + String(change.value)
                  : valueType === 'Array'
                    ? (currentValue as unknown[]).concat(change.value)
                    : valueType === 'Object'
                      ? foundry.utils.mergeObject(
                            currentValue as object,
                            JSON.parse(change.value),
                        )
                      : currentValue;
        case CONST.ACTIVE_EFFECT_MODES.MULTIPLY:
            return valueType === 'number'
                ? (currentValue as number) * tryParseNumber(change.value)
                : currentValue;
        case CONST.ACTIVE_EFFECT_MODES.UPGRADE:
            return valueType === 'number'
                ? Math.max(currentValue as number, tryParseNumber(change.value))
                : valueType === 'string'
                  ? (currentValue as string).localeCompare(change.value) > 0
                      ? currentValue
                      : change.value
                  : currentValue;
        case CONST.ACTIVE_EFFECT_MODES.DOWNGRADE:
            return valueType === 'number'
                ? Math.min(currentValue as number, tryParseNumber(change.value))
                : valueType === 'string'
                  ? (currentValue as string).localeCompare(change.value) < 0
                      ? currentValue
                      : change.value
                  : currentValue;
        case CONST.ACTIVE_EFFECT_MODES.OVERRIDE:
        case CONST.ACTIVE_EFFECT_MODES.CUSTOM:
        default:
            return change.value;
    }
}

function tryParseNumber(value: string): number {
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
}
