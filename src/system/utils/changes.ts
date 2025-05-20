import { ChangeData } from '@system/data/item/misc/change';

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
                ? (currentValue as number) + Number(change.value)
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
                ? (currentValue as number) * Number(change.value)
                : currentValue;
        case CONST.ACTIVE_EFFECT_MODES.UPGRADE:
            return valueType === 'number'
                ? Math.max(currentValue as number, Number(change.value))
                : valueType === 'string'
                  ? (currentValue as string).localeCompare(change.value) > 0
                      ? currentValue
                      : change.value
                  : currentValue;
        case CONST.ACTIVE_EFFECT_MODES.DOWNGRADE:
            return valueType === 'number'
                ? Math.min(currentValue as number, Number(change.value))
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
