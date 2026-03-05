// Quench test registration entry point.
// This file is conditionally imported from src/index.ts based on the
// __INCLUDE_TESTS__ build flag, ensuring test code is excluded from production builds.

import type { Quench } from '@ethaks/fvtt-quench';

import { registerActorTests } from './actor-tests';
import { registerItemTests } from './item-tests';
import { registerUtilTests } from './util-tests';

export function registerQuenchTests(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Hooks.on('quenchReady' as any, (quench: Quench) => {
        registerActorTests(quench);
        registerItemTests(quench);
        registerUtilTests(quench);
    });
}
