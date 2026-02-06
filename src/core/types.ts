export type Segment<T = unknown> = {
    id: string;
    label?: string;
    weight?: number;
    data?: T;
};

export type RouletteConfig<T = unknown> = {
    segments: Segment<T>[];
    minRotations?: number;
    maxRotations?: number;
    rotationDirection?: 1 | -1;
    pointerAngle?: number;
    startAngle?: number; // initial wheel angle
    durationMs?: number;
    easing?: (t: number) => number;
    jitterFactor?: number;
    seed?: number | string;
    rng?: () => number;
};

export type SpinOptions = {
    targetIndex?: number;
    targetAngle?: number; // base alignment angle in degrees
    durationMs?: number;
    minRotations?: number;
    maxRotations?: number;
};

export type RouletteState<T = unknown> = {
    phase: "idle" | "spinning" | "stopped";
    angle: number;
    elapsedMs: number;
    durationMs: number;
    spinStartAngle: number;
    targetAngle: number | null;
    winningIndex: number | null;
    segments: Segment<T>[];
};

export type SpinPlan = {
    winningIndex: number;
    targetAngle: number;
    durationMs: number;
    rotations: number;
};

export type RouletteEvent<T = unknown> =
	| { type: "spin:start"; state: RouletteState<T> }
	| { type: "spin:tick"; state: RouletteState<T> }
	| { type: "spin:complete"; state: RouletteState<T> };

export type RouletteEngine<T = unknown> = {
	getState(): RouletteState<T>;
	setState(next: RouletteState<T>): void;
	setSegments(segments: Segment<T>[]): void;
	spin(options?: SpinOptions): SpinPlan;
	stopAt(index: number): SpinPlan;
	tick(deltaMs: number): RouletteState<T>;
	subscribe(listener: (event: RouletteEvent<T>) => void): () => void;
	dispose(): void;
};
