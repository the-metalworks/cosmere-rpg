import { SYSTEM_ID } from '@system/constants';

export type MessageInteracted = (
    message: ChatMessage,
    event: JQuery.Event,
) => boolean;
export const MessageInteracted = `${SYSTEM_ID}.chatMessageInteracted` as const;
