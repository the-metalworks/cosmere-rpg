/**
 * Represents a ray in 2D space.
 * Rays are defined by an origin point and a direction vector and extend infinitely in one direction.
 */
export class Ray {
    public constructor(
        public readonly origin: PIXI.Point,
        public readonly direction: PIXI.Point,
    ) {}

    /**
     * Returns the point of intersection between this ray and another ray.
     * If the rays do not intersect, `null` is returned.
     */
    public intersection(ray: Ray): PIXI.Point | null {
        // Check if the rays are parallel
        const cross =
            this.direction.x * ray.direction.y -
            this.direction.y * ray.direction.x;
        if (cross === 0) return null; // Parallel rays do not intersect

        // Calculate the difference in origins
        const originDiff = new PIXI.Point(
            ray.origin.x - this.origin.x,
            ray.origin.y - this.origin.y,
        );

        // Calculate the t and u parameters for the intersection point
        const t =
            (originDiff.x * ray.direction.y - originDiff.y * ray.direction.x) /
            cross;
        const u =
            (originDiff.x * this.direction.y -
                originDiff.y * this.direction.x) /
            cross;

        // Ensure the intersection lies on both rays
        if (t < 0 || u < 0) return null; // Intersection is behind the ray origin

        // Calculate the intersection point
        const intersectionPoint = new PIXI.Point(
            this.origin.x + t * this.direction.x,
            this.origin.y + t * this.direction.y,
        );

        return intersectionPoint;
    }
}
