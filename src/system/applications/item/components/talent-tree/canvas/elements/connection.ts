// Glow filter
import { GlowFilter } from '@pixi/filter-glow';

// Canvas
import { PIXICanvasApplication, Drawable } from '@system/applications/canvas';
import { TalentTreeWorld } from '../world';

// Types
import { TalentTree } from '@system/types/item';

// Math
import { Ray } from '@system/math';

// Constants
const HIT_AREA_SIZE = 5;

export class Connection extends Drawable {
    // Re-declare canvas type
    public declare readonly canvas: PIXICanvasApplication<
        typeof TalentTreeWorld
    >;

    public selected = false;

    private fromPos: PIXI.IPointData;
    private toPos: PIXI.IPointData;

    public constructor(
        canvas: PIXICanvasApplication,
        public readonly from: TalentTree.TalentNode,
        public readonly to: TalentTree.TalentNode,
        public readonly path?: PIXI.Point[],
    ) {
        super(canvas);

        this.zIndex = 2;

        this.fromPos = this.from.position;
        this.toPos = this.to.position;

        // Set filters
        this.filters = [
            new GlowFilter({
                distance: 11,
                outerStrength: 1,
                alpha: 0.2,
            }),
            new PIXI.ColorMatrixFilter(),
        ];

        this.refresh();
    }

    /* --- Accessors --- */

    public get glowFilter() {
        return this.filters![0] as GlowFilter;
    }

    public get colorMatrixFilter() {
        return this.filters![1] as PIXI.ColorMatrixFilter;
    }

    /**
     * Whether the connection is obtained by the context actor.
     * A connection is obtained if the context actor both the talents represented by the FROM and TO nodes.
     */
    public get isConnectionObtained() {
        // Get context actor
        const actor = this.canvas.world.contextActor;
        if (!actor) return false;

        // Check if the actor has the talents
        return (
            actor.hasTalent(this.from.talentId) &&
            actor.hasTalent(this.to.talentId)
        );
    }

    /**
     * Whether the connection is available to be unlocked.
     * A connection is available if the TO talent is obtained and the FROM talent is not obtained,
     * and the context actor has the required prerequisites for the FROM talent.
     */
    public get isConnectionAvailable() {
        // Get context actor
        const actor = this.canvas.world.contextActor;
        if (!actor) return false;

        // Ensure the actor has the TO talent
        if (!actor.hasTalent(this.to.talentId)) return false;

        // Ensure the actor does NOT have the FROM talent
        if (actor.hasTalent(this.from.talentId)) return false;

        // Check prerequisites
        return actor.hasTalentPreRequisites(this.to.prerequisites);
    }

    public select() {
        this.selected = true;
        this.markDirty();
    }

    public deselect() {
        this.selected = false;
        this.markDirty();
    }

    public refresh() {
        if (this.canvas.world.editable) {
            this.interactive = true;
            this.cursor = 'pointer'; // TODO: Depends on view

            // Generate hit area
            this.generateHitArea();
        }
    }

    public override _update() {
        // Check if the from or to node has moved
        const nodesMoved =
            this.from.position.x !== this.fromPos.x ||
            this.from.position.y !== this.fromPos.y ||
            this.to.position.x !== this.toPos.x ||
            this.to.position.y !== this.toPos.y;

        if (nodesMoved) {
            this.fromPos = this.from.position;
            this.toPos = this.to.position;

            void this.draw(true);
        }
    }

    public override _draw() {
        // Draw path
        this.drawPath();

        // // Debug hit area
        // this.lineStyle(1, 'red');
        // this.drawPolygon(this.hitArea as PIXI.Polygon);

        // Update filters
        if (
            !this.canvas.world.editable &&
            !!this.canvas.world.contextActor &&
            !this.isConnectionObtained
        ) {
            if (this.isConnectionAvailable) {
                this.colorMatrixFilter.greyscale(0.1, false);
            } else {
                this.colorMatrixFilter.greyscale(0.05, false);
            }
        } else {
            this.colorMatrixFilter.reset();
        }
    }

    private drawPath() {
        // Set line style
        this.lineStyle({
            width: 3,
            color:
                this.canvas.world.editable && !!this.canvas.world.contextActor
                    ? !this.selected
                        ? 'white'
                        : 'gold'
                    : this.isConnectionObtained
                      ? '#7ba8fc'
                      : 'white',
        });

        if (!this.path || this.path.length === 0) {
            this.moveTo(
                this.from.position.x + this.from.size.width / 2,
                this.from.position.y + this.from.size.height / 2,
            );
            this.lineTo(
                this.to.position.x + this.to.size.width / 2,
                this.to.position.y + this.to.size.height / 2,
            );
        } else {
            for (let i = 0; i < this.path.length; i++) {
                const point = this.path[i];
                if (i === 0) {
                    this.moveTo(point.x, point.y);
                } else {
                    this.lineTo(point.x, point.y);
                }
            }
        }
    }

    /**
     * Helper function to generate a polygon hit area for the connection.
     * This is used to make the connection clickable.
     */
    private generateHitArea() {
        const from = new PIXI.Point(
            this.from.position.x + this.from.size.width / 2,
            this.from.position.y + this.from.size.height / 2,
        );
        const to = new PIXI.Point(
            this.to.position.x + this.to.size.width / 2,
            this.to.position.y + this.to.size.height / 2,
        );

        const path = [to, ...(this.path ?? []), from].map(
            (p) => new PIXI.Point(p.x, p.y),
        );

        const polygonPoints = new Array<PIXI.Point>();

        // Walk through the path and generate a hit area
        path.forEach((point, index) => {
            const isFirst = index === 0;
            const isLast = index === path.length - 1;

            // For the first point, add the first and last points to the hit area polygon
            if (isFirst) {
                return polygonPoints.push(
                    point,
                    point
                        .add(
                            path[1]
                                .subtract(point)
                                .normalize()
                                .multiplyScalar(HIT_AREA_SIZE),
                        )
                        .add(
                            path[1]
                                .subtract(point)
                                .tanget()
                                .multiplyScalar(HIT_AREA_SIZE),
                        ),

                    path[path.length - 1]
                        .add(
                            path[path.length - 2]
                                .subtract(path[path.length - 1])
                                .normalize()
                                .multiplyScalar(HIT_AREA_SIZE),
                        )
                        .add(
                            path[path.length - 2]
                                .subtract(path[path.length - 1])
                                .tanget()
                                .multiplyScalar(-HIT_AREA_SIZE),
                        ),
                    path[path.length - 1],
                    path[path.length - 1]
                        .add(
                            path[path.length - 2]
                                .subtract(path[path.length - 1])
                                .normalize()
                                .multiplyScalar(HIT_AREA_SIZE),
                        )
                        .add(
                            path[path.length - 2]
                                .subtract(path[path.length - 1])
                                .tanget()
                                .multiplyScalar(HIT_AREA_SIZE),
                        ),

                    point
                        .add(
                            path[1]
                                .subtract(point)
                                .normalize()
                                .multiplyScalar(HIT_AREA_SIZE),
                        )
                        .add(
                            path[1]
                                .subtract(point)
                                .tanget()
                                .multiplyScalar(-HIT_AREA_SIZE),
                        ),
                );
            } else if (isLast) {
                return;
            }

            // Get the previous and next points
            const prevPoint = path[index - 1];
            const nextPoint = path[index + 1];

            // Calculate the vectors to the previous and next points
            const toPrevVec = prevPoint.subtract(point).normalize();
            const toNextVec = nextPoint.subtract(point).normalize();

            // Calculate the facing of the corner (1 = left, -1 = right)
            const cornerFacing = toPrevVec.dot(toNextVec.tanget()) > 0 ? 1 : -1;

            // Get the angle between the vectors
            const angle = toNextVec.angle(toPrevVec) * cornerFacing;

            // Calculate the middle of the corner
            const cornerMiddle = toPrevVec.rotate(angle / 2).normalize();

            // Calculate the corner points
            const cornerL = new Ray(
                prevPoint.add(
                    toPrevVec.tanget().multiplyScalar(-HIT_AREA_SIZE),
                ),
                toPrevVec.multiplyScalar(-1),
            ).intersection(
                new Ray(point, cornerMiddle.multiplyScalar(cornerFacing)),
            )!;
            const cornerR = new Ray(
                prevPoint.add(toPrevVec.tanget().multiplyScalar(HIT_AREA_SIZE)),
                toPrevVec.multiplyScalar(-1),
            ).intersection(
                new Ray(point, cornerMiddle.multiplyScalar(-cornerFacing)),
            )!;

            if (!cornerL || !cornerR) {
                console.error(
                    'Failed to generate corner points:',
                    cornerL,
                    cornerR,
                );
                return;
            }

            // Add the corner points to the hit area polygon
            polygonPoints.splice(index + 1, 0, cornerL);
            polygonPoints.splice(index + 5, 0, cornerR);
        });

        this.hitArea = new PIXI.Polygon(polygonPoints);
    }
}
