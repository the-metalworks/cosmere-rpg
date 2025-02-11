/// <reference path="./vector.d.ts" />

// Pixi math
import '@pixi/math-extras';

/**
 * Finds the distance between two points
 */
export function distance(this: PIXI.Point, b: Point): number {
    // Find the length
    return this.subtract(b).magnitude();
}

export function angle(this: PIXI.Point, b: Point): number {
    b = new PIXI.Point(b.x, b.y);

    // Calculate dot product
    const d = this.dot(b);

    // Calculate lengths
    const lenA = this.magnitude();
    const lenB = (b as PIXI.Point).magnitude();

    // Calculate angle
    const rad = Math.acos(d / (lenA * lenB));
    const deg = Math.toDegrees(rad);

    return deg > 180 ? 360 - deg : deg;
}

export function tanget(this: PIXI.Point): PIXI.Point {
    const a = { x: this.x, y: this.y, z: 0 };
    const b = { x: 0, y: 0, z: 1 };

    return new PIXI.Point(
        a.y * b.z - a.z * b.y,
        a.z * b.x - a.x * b.z,
    ).normalize();
}

export function rotate(this: PIXI.Point, angle: number): PIXI.Point {
    const rad = Math.toRadians(angle);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return new PIXI.Point(
        this.x * cos - this.y * sin,
        this.x * sin + this.y * cos,
    );
}

/* --- Define mixins --- */

const mixins = {
    distance,
    angle,
    tanget,
    rotate,
};

Object.assign(PIXI.Point.prototype, mixins);
