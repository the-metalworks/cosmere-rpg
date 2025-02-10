interface PointLike {
    x: number;
    y: number;
}

declare namespace GlobalMixins {
    export interface Point {
        /**
         * Finds the distance between two points
         */
        distance(other: PointLike): number;

        /**
         * Finds the shortest angle between two points
         * @param b
         */
        angle(b: PointLike): number;

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
