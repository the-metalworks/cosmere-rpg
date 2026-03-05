// Skeleton test batch for Actor document operations.
// Replace placeholder assertions with real tests against your Actor data models.

import type { Quench } from '@ethaks/fvtt-quench';

export function registerActorTests(quench: Quench): void {
    quench.registerBatch(
        'cosmere-rpg.actors.character',
        (context) => {
            const { describe, it, expect, before, after } = context;

            let actor: Actor | undefined;

            describe('Character Actor', () => {
                before(async () => {
                    actor = await Actor.create({
                        name: 'Test Character',
                        type: 'character',
                    });
                });

                after(async () => {
                    await actor?.delete();
                });

                it('should be created with the correct type', () => {
                    expect(actor).to.not.be.undefined;
                    expect(actor?.type).to.equal('character');
                });

                it('should have a name', () => {
                    expect(actor?.name).to.equal('Test Character');
                });

                describe('Data Model', () => {
                    it('should have a system data object', () => {
                        expect(actor?.system).to.be.an('object');
                    });

                    // TODO: Add tests for specific data model fields
                    // e.g., attributes, skills, health, etc.
                });
            });
        },
        { displayName: 'Cosmere RPG: Character Actors' },
    );

    quench.registerBatch(
        'cosmere-rpg.actors.adversary',
        (context) => {
            const { describe, it, expect, before, after } = context;

            let actor: Actor | undefined;

            describe('Adversary Actor', () => {
                before(async () => {
                    actor = await Actor.create({
                        name: 'Test Adversary',
                        type: 'adversary',
                    });
                });

                after(async () => {
                    await actor?.delete();
                });

                it('should be created with the correct type', () => {
                    expect(actor).to.not.be.undefined;
                    expect(actor?.type).to.equal('adversary');
                });

                it('should have a system data object', () => {
                    expect(actor?.system).to.be.an('object');
                });
            });
        },
        { displayName: 'Cosmere RPG: Adversary Actors' },
    );
}
