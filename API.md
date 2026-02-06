# Roulette Library API (Draft)

## Design Goals

- Framework-agnostic, headless core.
- SSR-safe (no DOM or `window` access).
- Two modes: controlled (pure state reducers) and imperative (engine instance).
- Deterministic RNG **only** when a seed is provided.
- Renderers are **out of scope** for v1 (future add-ons).

## Core Types

```ts
export type Segment<T = unknown> = {
  id: string;
  label?: string;
  weight?: number; // defaults to 1
  data?: T;
};

export type RouletteConfig<T = unknown> = {
  segments: Segment<T>[];
  // Rotation behavior
  minRotations?: number; // default 3
  maxRotations?: number; // default 6
  rotationDirection?: 1 | -1; // 1 = clockwise (default)
  pointerAngle?: number; // degrees, default 0
  startAngle?: number; // initial wheel angle in degrees, default 0
  // Timing / easing
  durationMs?: number; // default 6000
  easing?: (t: number) => number; // t in [0..1]
  // Jitter
  jitterFactor?: number; // 0..1, default 0.3 (portion of segment angle)
  // RNG
  seed?: number | string; // if provided, use deterministic RNG
  rng?: () => number; // overrides seed if provided
};

export type SpinOptions = {
  targetIndex?: number; // force winner
  targetAngle?: number; // base alignment angle in degrees (mod 360)
  durationMs?: number; // overrides config duration
  minRotations?: number; // overrides config
  maxRotations?: number; // overrides config
};

export type RouletteState<T = unknown> = {
  phase: "idle" | "spinning" | "stopped";
  angle: number; // degrees
  elapsedMs: number;
  durationMs: number;
  spinStartAngle: number;
  targetAngle: number | null;
  winningIndex: number | null;
  segments: Segment<T>[];
};

export type SpinPlan = {
  winningIndex: number;
  targetAngle: number; // degrees
  durationMs: number;
  rotations: number;
};

export type RouletteEvent<T = unknown> =
  | { type: "spin:start"; state: RouletteState<T> }
  | { type: "spin:tick"; state: RouletteState<T> }
  | { type: "spin:complete"; state: RouletteState<T> };
```

## Controlled Mode API

```ts
export function createInitialState<T>(config: RouletteConfig<T>): RouletteState<T>;

export function planSpin<T>(
  state: RouletteState<T>,
  config: RouletteConfig<T>,
  options?: SpinOptions,
): SpinPlan;

export function beginSpin<T>(
  state: RouletteState<T>,
  plan: SpinPlan,
): RouletteState<T>;

export function step<T>(
  state: RouletteState<T>,
  config: RouletteConfig<T>,
  deltaMs: number,
): RouletteState<T>;

export function selectWeightedIndex<T>(
  segments: Segment<T>[],
  rng: () => number,
): number;
```

## Imperative Engine API

```ts
export function createRouletteEngine<T>(config: RouletteConfig<T>): {
  getState(): RouletteState<T>;
  setState(next: RouletteState<T>): void;
  setSegments(segments: Segment<T>[]): void;
  spin(options?: SpinOptions): SpinPlan;
  stopAt(index: number): SpinPlan;
  tick(deltaMs: number): RouletteState<T>;
  subscribe(listener: (event: RouletteEvent<T>) => void): () => void;
  dispose(): void;
};
```

## Behavioral Notes

- **Determinism**: if `seed` is provided (and `rng` is not), an internal seeded RNG is used. Otherwise `Math.random` is used.
- **Segments**: geometry assumes equal angular sizes; `weight` only affects selection.
- **Target selection**: `planSpin` computes a `targetAngle` that lands the segment center on the `pointerAngle`, plus optional jitter within the segment (not applied when `targetAngle` is provided).
- **Rotation**: `rotationDirection` controls clockwise vs counter‑clockwise motion.
- **Events**: imperative engine emits `spin:start`, `spin:tick` on each `tick`, and `spin:complete` once done.

## Future (Out of Scope for v1)

- Canvas/DOM/SVG renderers that consume `RouletteState`.
- Built‑in UI components or styling.
