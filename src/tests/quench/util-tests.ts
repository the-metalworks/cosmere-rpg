// Skeleton test batch for utility functions.
// Utility tests can exercise pure functions without needing Foundry documents.

import type { Quench } from '@ethaks/fvtt-quench';

export function registerUtilTests(quench: Quench): void {
    quench.registerBatch(
        'cosmere-rpg.utils',
        (context) => {
            const { describe, it, expect } = context;

            describe('System Configuration', () => {
                it('should have system ID "cosmere-rpg"', () => {
                    expect(game.system.id).to.equal('cosmere-rpg');
                });

                it('should have CONFIG.COSMERE defined', () => {
                    expect(CONFIG.COSMERE).to.be.an('object');
                });
            });

            // TODO: Add tests for pure utility functions, e.g.:
            // import { someUtil } from '@system/utils/someUtil';
            // describe('someUtil', () => { ... });
        },
        { displayName: 'Cosmere RPG: Utilities' },
    );
}
