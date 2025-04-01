/// <reference path="./vector.d.ts" />

/**
 * Adds other to this point
 */
export function add(this: PIXI.Point, b: Point): Point {
    return new PIXI.Point(this.x + b.x, this.y + b.y);
}

/**
 * Subtracts other from this point
 */
export function subtract(this: PIXI.Point, b: Point): Point {
    return new PIXI.Point(this.x - b.x, this.y - b.y);
}

/**
 * Multiplies this point by another point
 */
export function multiply(this: PIXI.Point, b: Point): Point {
    return new PIXI.Point(this.x * b.x, this.y * b.y);
}

/**
 * Multiplies this point by a scalar value
 */
export function multiplyScalar(this: PIXI.Point, scalar: number): Point {
    return new PIXI.Point(this.x * scalar, this.y * scalar);
}

/**
 * Computes the dot product of other with this point.
 * The dot product is the sum of the products of the corresponding components of two vectors
 */
export function dot(this: PIXI.Point, b: Point): number {
    return this.x * b.x + this.y * b.y;
}

/**
 * Computes the cross product of other with this point.
 * Given two linearly independent R3 vectors a and b, the cross product, a × b (read "a cross b"),
 * is a vector that is perpendicular to both a and b, and thus normal to the plane containing them.
 * While cross product only exists on 3D space, we can assume the z component of 2D to be zero and
 * the result becomes a vector that will only have magnitude on the z axis.
 *
 * This function returns the z component of the cross product of the two points.
 */
export function cross(this: PIXI.Point, b: Point): number {
    return this.x * b.y - this.y * b.x;
}

/**
 * Computes a normalized version of this point.
 * A normalized vector is a vector of magnitude (length) 1.
 */
export function normalize(this: PIXI.Point): PIXI.Point {
    const magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
    return new PIXI.Point(this.x / magnitude, this.y / magnitude);
}

/**
 * Computes the magnitude of this point (Euclidean distance from 0, 0).
 * Defined as the square root of the sum of the squares of each component.
 */
export function magnitude(this: PIXI.Point): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
}

/**
 * Computes the projection of this point onto another point.
 * The projection of a vector a onto a vector b is the orthogonal projection of a onto b.
 * It is the vector in the direction of b that is closest to a.
 */
export function project(this: PIXI.Point, b: Point): PIXI.Point {
    const normalizedScalarProjection =
        (this.x * b.x + this.y * b.y) / (b.x * b.x + b.y * b.y);
    return new PIXI.Point(
        normalizedScalarProjection * b.x,
        normalizedScalarProjection * b.y,
    );
}

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
    add,
    subtract,
    multiply,
    multiplyScalar,
    dot,
    cross,
    normalize,
    magnitude,
    project,
    distance,
    angle,
    tanget,
    rotate,
};

Object.assign(PIXI.Point.prototype, mixins);
