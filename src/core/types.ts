/** A single roulette segment (visual slice) and its selection weight. */
export type Segment<T = unknown> = {
    /** Unique identifier for stable selection and rendering. */
    id: string;
    /** Optional display label. */
    label?: string;
    /** Relative selection weight (defaults to 1). */
    weight?: number;
    /** Optional payload associated with the segment. */
    data?: T;
};

/** Configuration for spinning behavior and selection. */
export type RouletteConfig<T = unknown> = {
    /** Available segments to select from. */
    segments: Segment<T>[];
    /** Minimum full rotations before stopping (default 3). */
    minRotations?: number;
    /** Maximum full rotations before stopping (default 6). */
    maxRotations?: number;
    /** 1 = clockwise (default), -1 = counter-clockwise. */
    rotationDirection?: 1 | -1;
    /** Pointer angle in degrees (default 0). */
    pointerAngle?: number;
    /** Initial wheel angle in degrees (default 0). */
    startAngle?: number; // initial wheel angle
    /** Total spin duration in ms (default 6000). */
    durationMs?: number;
    /** Easing function for spin progress. */
    easing?: (t: number) => number;
    /** Jitter factor within a segment (0..1, default 0.3). */
    jitterFactor?: number;
    /** Seed for deterministic RNG (only used if rng is not provided). */
    seed?: number | string;
    /** Custom RNG that overrides seed and Math.random. */
    rng?: () => number;
};

/** Per-spin overrides. */
export type SpinOptions = {
    /** Force a specific winning index. */
    targetIndex?: number;
    /** Force a base alignment angle in degrees (mod 360). */
    targetAngle?: number; // base alignment angle in degrees
    /** Override spin duration in ms. */
    durationMs?: number;
    /** Override minimum rotations. */
    minRotations?: number;
    /** Override maximum rotations. */
    maxRotations?: number;
};

/** Runtime state for the roulette engine. */
export type RouletteState<T = unknown> = {
    /** Current lifecycle phase. */
    phase: "idle" | "spinning" | "stopped";
    /** Current wheel angle in degrees. */
    angle: number;
    /** Elapsed time since spin start in ms. */
    elapsedMs: number;
    /** Spin duration in ms. */
    durationMs: number;
    /** Angle at spin start. */
    spinStartAngle: number;
    /** Final target angle for the current spin. */
    targetAngle: number | null;
    /** Index of the winning segment. */
    winningIndex: number | null;
    /** Current segments. */
    segments: Segment<T>[];
};

/** Computed plan for a spin. */
export type SpinPlan = {
    /** Chosen winning index. */
    winningIndex: number;
    /** Absolute target angle in degrees. */
    targetAngle: number;
    /** Spin duration in ms. */
    durationMs: number;
    /** Number of full rotations. */
    rotations: number;
};

/** Events emitted by the imperative engine. */
export type RouletteEvent<T = unknown> =
    | { type: "spin:start"; state: RouletteState<T> }
    | { type: "spin:tick"; state: RouletteState<T> }
    | { type: "spin:complete"; state: RouletteState<T> }
    | { type: "spin:reset"; state: RouletteState<T> }
    | { type: "dispose"; state: RouletteState<T> };

/** Imperative roulette engine interface. */
export type RouletteEngine<T = unknown> = {
    /** Read the current state snapshot. */
    getState(): RouletteState<T>;
    /** Replace the current state snapshot. */
    setState(next: RouletteState<T>): void;
    /** Replace the current segment list. */
    setSegments(segments: Segment<T>[]): void;
    /** Start a spin and return the computed plan. */
    spin(options?: SpinOptions): SpinPlan;
    /** Start a spin and return a promise that resolves with the plan when the spin completes. */
    spinAsync(options?: SpinOptions): Promise<SpinPlan>;
    /** Convenience for spinning to a specific index. */
    stopAt(index: number): SpinPlan;
    /** Return the winning segment, or null if no winner yet. */
    getWinningSegment(): Segment<T> | null;
    /** Advance the animation by deltaMs. */
    tick(deltaMs: number): RouletteState<T>;
    /** Start a requestAnimationFrame tick loop. (Browser only) */
    start(): void;
    /** Stop the requestAnimationFrame tick loop. */
    stop(): void;
    /** Subscribe to lifecycle events. */
    subscribe(listener: (event: RouletteEvent<T>) => void): () => void;
    /** Reset the engine back to idle state. */
    reset(): void;
    /** Dispose the engine and remove listeners. */
    dispose(): void;
};
