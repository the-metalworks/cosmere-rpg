// PIXI
import { GlowFilter } from '@pixi/filter-glow';

// Canvas
import {
    PIXICanvasApplication,
    Animation,
    AnimationFunction,
} from '@system/applications/canvas';
import { TalentTreeWorld } from '../../world';

// Types
import { TalentTree } from '@system/types/item';
import { TalentItem } from '@system/documents/item';

// Import base node
import { BaseNode } from './types';

// Nodes
import { TalentTreeNode } from './tree-node';

export class TalentNode extends BaseNode {
    // Redeclare data type
    public declare readonly data: TalentTree.TalentNode;
    public declare readonly canvas: PIXICanvasApplication<
        typeof TalentTreeWorld
    >;

    private img: string;
    private texture?: PIXI.Texture;

    private _highlighted = false;

    private hoverAnimations: Animation[] = [];

    private prevIsTalentObtained = false;

    public constructor(
        canvas: PIXICanvasApplication,
        data: TalentTree.TalentNode,
    ) {
        super(canvas, data);

        // Get the item
        const item = fromUuidSync(this.data.uuid) as Pick<
            TalentItem,
            'name' | 'img'
        >;

        this.name = item.name;
        this.img = item.img;

        // Set event mode
        this.eventMode = 'static';

        // Set filters
        this.filters = [
            new GlowFilter({
                distance: 15,
                outerStrength: 1.5,
                alpha: 0,
                quality: 0.2,
                color: 0x7fa4e9,
            }),
            new PIXI.ColorMatrixFilter(),
        ];

        // Register event handlers
        this.on('mouseover', this.onMouseOver.bind(this));
        this.on('mouseout', this.onMouseOut.bind(this));
    }

    public override async _initialize() {
        this.texture = (await loadTexture(this.img)) as PIXI.Texture;
    }

    /* --- Accessors --- */

    public override get size() {
        return {
            width: this.data.size.width,
            height: this.data.size.height,
        };
    }

    public get glowFilter() {
        return this.filters![0] as GlowFilter;
    }

    public get colorMatrixFilter() {
        return this.filters![1] as PIXI.ColorMatrixFilter;
    }

    public get highlighted() {
        return this._highlighted;
    }

    public set highlighted(value: boolean) {
        this._highlighted = value;

        if (this._highlighted) {
            this.glowFilter.color = 0xffd700;
            this.glowFilter.alpha = 0.5;
        } else {
            this.glowFilter.color = 0x7fa4e9;
            this.glowFilter.alpha = 0.2;
        }
    }

    /**
     * Whether the talent represented by this node is obtained
     * by the context actor.
     */
    public get isTalentObtained() {
        // Get context actor
        const actor = this.canvas.world.contextActor;
        if (!actor) return false;

        // Check if the actor has the talent
        return actor.hasTalent(this.data.talentId);
    }

    /**
     * Whether the talent represented by this node is available
     * to be unlocked by the context actor.
     * For a talent to be available, all of its prerequisites must be met.
     */
    public get isTalentAvailable() {
        // Get context actor
        const actor = this.canvas.world.contextActor;
        if (!actor) return false;

        // Check if the actor has the talent already
        if (actor.hasTalent(this.data.talentId)) return false;

        // Check prerequisites
        return actor.hasTalentPreRequisites(
            this.data.prerequisites,
            this.canvas.world.tree.item,
        );
    }

    public get parentNode() {
        const parent = this.parent.parent;
        return parent instanceof TalentTreeNode ? parent : null;
    }

    /* --- Event handlers --- */

    private onMouseOver(event: PIXI.FederatedMouseEvent) {
        if (this.canvas.world.editable) return;
        if (this.isTalentObtained || !this.isTalentAvailable) return;

        // Get available connections from this node
        const connections = this.parentNode!.connections!.filter(
            (connection) => connection.from.data.id === this.data.id,
        ).filter((connection) => connection.isAvailable);

        // Get glow filter
        const glowFilter = this.glowFilter;
        const colorMatrixFilter = this.colorMatrixFilter;

        this.hoverAnimations.push(
            new AnimationFunction({
                func: function (this: Animation, delta: number) {
                    colorMatrixFilter.saturate(
                        0.5 + this.progress * 0.5,
                        false,
                    );
                    colorMatrixFilter.brightness(
                        0.6 + this.progress * 0.4,
                        false,
                    );

                    connections.forEach((c) => {
                        c.colorMatrixFilter.greyscale(
                            0.1 + this.progress * 0.1,
                            false,
                        );
                    });
                },
                duration: 300,
                ticker: this.canvas.app.ticker,
                easing: Animation.EASING.easeInOutQuad,
            }),
        );

        glowFilter.alpha = 0.2;
        this.hoverAnimations.push(
            new AnimationFunction({
                // Animate glow filter outer strength from 0 to 2 and back
                func: function (this: Animation, delta: number) {
                    glowFilter.outerStrength =
                        Math.sin(this.progress * Math.PI) * 2;
                },
                duration: 2000,
                ticker: this.canvas.app.ticker,
                loop: true,
                callback: () => {
                    // Reset outer strength
                    glowFilter.outerStrength = 1;
                    glowFilter.alpha = 0;
                },
            }),
        );

        // Start animations
        this.hoverAnimations.forEach((animation) => animation.start());
    }

    private onMouseOut(event: PIXI.FederatedMouseEvent) {
        if (this.canvas.world.editable) return;
        if (this.isTalentObtained || !this.isTalentAvailable) return;

        // Get available connections from this node
        const connections = this.parentNode!.connections!.filter(
            (connection) => connection.from.data.id === this.data.id,
        ).filter((connection) => connection.isAvailable);

        // Stop animations
        this.hoverAnimations.forEach((animation) => animation.stop());
        this.hoverAnimations = [];

        // Reset color matrix filter
        this.colorMatrixFilter.reset();
        this.colorMatrixFilter.saturate(0.5, false);
        this.colorMatrixFilter.brightness(0.6, false);

        // Reset connections
        connections.forEach((c) => {
            if (c.isObtained) c.colorMatrixFilter.reset();
            else c.colorMatrixFilter.greyscale(0.1, false);
        });
    }

    /* --- Drawing --- */

    protected override _draw() {
        // Create container for masked content
        const container = new PIXI.Container();

        const width = this.data.size.width;
        const height = this.data.size.height;

        if (!this.data.showName) {
            if (!this.texture) return;

            // Create the sprite
            const sprite = new PIXI.Sprite(this.texture);

            // Set the size
            sprite.width = width;
            sprite.height = height;

            // Add the sprite
            container.addChild(sprite);

            // Create the mask
            const mask = new PIXI.Graphics();
            mask.beginFill(0xffffff);
            mask.drawRoundedRect(
                0,
                0,
                width,
                height,
                TalentNode.CORNER_RADIUS_DEFAULT,
            );

            // Apply the mask
            sprite.mask = mask;

            // Add the mask
            container.addChild(mask);
        } else {
            // Create the text
            const text = new PIXI.Text(this.name!, {
                fontSize: 16,
                fill: '#010e2d',
                fontFamily: 'Didact Gothic',
                fontWeight: 'bold',
            });

            // Set the position
            text.position.set(width / 2, height / 2);
            text.anchor.set(0.5);

            // Add the text
            container.addChild(text);
        }

        // Add container
        this.addChild(container);

        // Draw the border
        if (!this.data.showName) {
            // Determine color
            const color =
                this.canvas.world.editable || !this.canvas.world.contextActor
                    ? this.selected
                        ? 'gold'
                        : 'white'
                    : this.isTalentObtained
                      ? '#7ba8fc'
                      : this.isTalentAvailable
                        ? 'gray'
                        : 'white';

            this.lineStyle({
                width: 4,
                color,
            });
        } else {
            this.beginFill('white');
        }

        // Draw the rounded rectangle
        this.drawRoundedRect(
            0,
            0,
            width,
            height,
            !this.data.showName ? TalentNode.CORNER_RADIUS_DEFAULT : 0,
        );

        // Update filters
        if (!this.canvas.world.editable && !!this.canvas.world.contextActor) {
            if (!this.isTalentObtained) {
                this.glowFilter.alpha = 0;

                if (this.isTalentAvailable) {
                    this.colorMatrixFilter.reset();
                    this.colorMatrixFilter.saturate(0.5, false);
                    this.colorMatrixFilter.brightness(0.6, false);
                    this.cursor = 'pointer';
                } else {
                    this.colorMatrixFilter.greyscale(0.05, false);
                    this.cursor = 'default';
                }
            } else {
                this.colorMatrixFilter.reset();
                this.glowFilter.alpha = 0.4;
                this.cursor = 'pointer';
            }
        } else {
            this.colorMatrixFilter.reset();
            this.cursor = this.canvas.world.editable ? 'pointer' : 'default';
        }

        this.prevIsTalentObtained = this.isTalentObtained;
    }

    /* --- Lifecycle --- */

    public override async refresh() {
        await super.refresh();

        if (this.prevIsTalentObtained !== this.isTalentObtained)
            this.markDirty();

        if (!this.parentNode) return;

        this.eventMode =
            !this.canvas.world.editable || this.parentNode.contentEditable
                ? 'static'
                : 'none';
    }
}

export namespace TalentNode {
    export const NODE_SIZE_DEFAULT = 50;
    export const CORNER_RADIUS_DEFAULT = 3;
}
