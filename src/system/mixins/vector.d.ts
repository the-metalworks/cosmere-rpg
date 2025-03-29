declare namespace GlobalMixins {
    export interface Point {
        /**
         * Adds other to this point
         * @param other
         */
        add(other: PIXI.IPointData): PIXI.Point;

        /**
         * Subtracts other from this point
         */
        subtract(other: PIXI.IPointData): PIXI.Point;

        /**
         * Multiplies this point by another point
         */
        multiply(other: PIXI.IPointData): PIXI.Point;

        /**
         * Multiplies this point by a scalar value
         */
        multiplyScalar(scalar: number): PIXI.Point;

        /**
         * Computes the dot product of other with this point.
         * The dot product is the sum of the products of the corresponding components of two vectors
         */
        dot(other: PIXI.IPointData): number;

        /**
         * Computes the cross product of other with this point.
         * Given two linearly independent R3 vectors a and b, the cross product, a × b (read "a cross b"),
         * is a vector that is perpendicular to both a and b, and thus normal to the plane containing them.
         * While cross product only exists on 3D space, we can assume the z component of 2D to be zero and
         * the result becomes a vector that will only have magnitude on the z axis.
         *
         * This function returns the z component of the cross product of the two points.
         */
        cross(other: PIXI.IPointData): number;

        /**
         * Computes a normalized version of this point.
         * A normalized vector is a vector of magnitude (length) 1.
         */
        normalize(): PIXI.Point;

        /**
         * Computes the magnitude of this point (Euclidean distance from 0, 0).
         * Defined as the square root of the sum of the squares of each component.
         */
        magnitude(): number;

        /**
         * Computes the projection of this point onto another point.
         * The projection of a vector a onto a vector b is the orthogonal projection of a onto b.
         * It is the vector in the direction of b that is closest to a.
         */
        project(other: PIXI.IPointData): PIXI.Point;

        /**
         * Finds the distance between two points
         */
        distance(other: PIXI.IPointData): number;

        /**
         * Finds the shortest angle between two points
         * @param b
         */
        angle(b: PIXI.IPointData): number;

        /**
         * Finds the tanget of the vector
         */
        tanget(this: PIXI.Point): PIXI.Point;

        /**
         * Rotates the vector by the given angle
         * @param angle
         */
        rotate(angle: number): PIXI.Point;
    }
}
