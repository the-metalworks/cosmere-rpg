// Skeleton test batch for Item document operations.
// Tests a representative set of the system's 16 item types.

import type { Quench } from '@ethaks/fvtt-quench';

export function registerItemTests(quench: Quench): void {
    const itemTypes = ['weapon', 'armor', 'talent', 'action', 'power'] as const;

    for (const itemType of itemTypes) {
        quench.registerBatch(
            `cosmere-rpg.items.${itemType}`,
            (context) => {
                const { describe, it, expect, before, after } = context;

                let item: Item | undefined;

                describe(`${itemType} Item`, () => {
                    before(async () => {
                        item = await Item.create({
                            name: `Test ${itemType}`,
                            type: itemType,
                        });
                    });

                    after(async () => {
                        await item?.delete();
                    });

                    it('should create successfully', () => {
                        expect(item).to.not.be.undefined;
                        expect(item?.type).to.equal(itemType);
                    });

                    it('should have system data', () => {
                        expect(item?.system).to.be.an('object');
                    });

                    // TODO: Add item-type-specific tests here
                });
            },
            { displayName: `Cosmere RPG: ${itemType} Items` },
        );
    }
}
