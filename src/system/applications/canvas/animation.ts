export interface AnimationConfig {
    ticker: PIXI.Ticker;
    /**
     * Duration in milliseconds
     */
    duration: number;
    /**
     * Whether the animation should loop
     *
     * @default false
     */
    loop?: boolean;
    /**
     * Easing function
     */
    easing?: (progress: number) => number;
    /**
     * Callback when the animation is over or stopped
     */
    callback?: () => void;
}

export abstract class Animation {
    public loop: boolean;

    private _running = false;
    private _time = 0;
    private _duration: number;

    private ticker: PIXI.Ticker;
    protected easing?: (progress: number) => number;
    protected callback?: () => void;
    private updateHandler = this._update.bind(this);

    public constructor({
        duration,
        ticker,
        loop,
        easing,
        callback,
    }: AnimationConfig) {
        this._duration = duration;
        this.ticker = ticker;
        this.easing = easing;
        this.callback = callback;
        this.loop = loop ?? false;
    }

    /* --- Accessors --- */

    /**
     * Is the animation running?
     */
    public get running(): boolean {
        return this._running;
    }

    /**
     * Elapsed time in milliseconds
     */
    public get time(): number {
        return this._time;
    }

    /**
     * Total duration in milliseconds
     */
    public get duration(): number {
        return this._duration;
    }

    /**
     * Progress from 0 to 1
     */
    public get progress(): number {
        const p = Math.clamp(this._time / this._duration, 0, 1);
        return this.easing ? this.easing(p) : p;
    }

    /* --- Public --- */

    public start() {
        if (this._running) return;

        this._running = true;

        this.ticker.add(this.updateHandler);
    }

    public stop() {
        if (!this._running) return;

        this._running = false;

        this.ticker.remove(this.updateHandler);

        // Invoke callback
        this.callback?.();
    }

    /* --- Abstract --- */

    protected abstract update(delta: number): void;

    /* --- Private --- */

    private _update() {
        // Delta in milliseconds
        const delta = this.ticker.deltaMS;

        // Update time
        this._time += delta;

        // Check if the animation is over
        if (this._time >= this._duration) {
            if (this.loop) {
                this._time = this._time % this._duration;
            } else {
                this.stop();
                return;
            }
        }

        // Perform update
        this.update(delta);
    }
}

interface AnimationFunctionConfig extends AnimationConfig {
    func: (delta: number) => void;
}

export class AnimationFunction extends Animation {
    private _func: (delta: number) => void;

    public constructor(config: AnimationFunctionConfig) {
        super(config);
        this._func = config.func;
    }

    protected update(delta: number) {
        // Invoke the function with `this`
        this._func.call(this, delta);
    }
}

export namespace Animation {
    export const EASING = {
        easeInOutQuad: (x: number) =>
            x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
    };
}
