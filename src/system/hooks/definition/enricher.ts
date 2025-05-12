import { SYSTEM_ID } from '@system/constants';

/**
 * Enricher Hooks
 *
 * Triggers:
 * All arguments will come from strings and the handler will need to convert into Documents
 * due to the nature of enrichers firing from the HTML, and so the options will need to be serialised
 */

export type EnricherTrigger = (
    actorId: string,
    source: string,
    data: Record<string, string>,
) => void;
export type TestEnricherTrigger = EnricherTrigger;
export type DamageEnricherTrigger = EnricherTrigger;
export const EnricherTrigger = (type: 'Test' | 'Damage') =>
    `${SYSTEM_ID}.trigger${type}Enricher` as const;
export const TestEnricherTrigger = EnricherTrigger('Test');
export const DamageEnricherTrigger = EnricherTrigger('Damage');
