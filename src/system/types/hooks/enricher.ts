/**
 * Enricher Hooks
 *
 * Triggers:
 * All arguments will come from strings and the handler will need to convert into Documents
 * due to the nature of enrichers firing from the HTML, and so the options will need to be serialised
 */

type TriggerEnricher = (
    actorId: string,
    source: string,
    data: Record<string, string>,
) => void;
export type TriggerTestEnricher = TriggerEnricher;
export type TriggerDamageEnricher = TriggerEnricher;
