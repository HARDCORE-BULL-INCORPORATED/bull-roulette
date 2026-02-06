import type { RouletteConfig, RouletteState, Segment, SpinOptions, SpinPlan } from "./types";
import { clamp, easeOutCubic, lerp, normalizeAngle, FULL_ROTATION } from "./math";
import { createSeededRng } from "./rng";

const DEFAULT_DURATION_MS = 6000;
const DEFAULT_MIN_ROTATIONS = 3;
const DEFAULT_MAX_ROTATIONS = 6;
const DEFAULT_POINTER_ANGLE = 0;
const DEFAULT_JITTER_FACTOR = 0.3;
const DEFAULT_ROTATION_DIRECTION: 1 | -1 = 1;

const resolveRng = <T>(config: RouletteConfig<T>): (() => number) => {
  if (config.rng) return config.rng;
  if (config.seed !== undefined) return createSeededRng(config.seed);
  return Math.random;
};

const resolveSegments = <T>(state: RouletteState<T>, config: RouletteConfig<T>): Segment<T>[] => {
  if (state.segments && state.segments.length > 0) return state.segments;
  return config.segments;
};

const resolveSegmentAngle = (segmentCount: number): number => FULL_ROTATION / segmentCount;

const pickRandomIntInclusive = (min: number, max: number, rng: () => number): number => {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.floor(rng() * (high - low + 1)) + low;
};

/** Select an index using segment weights (negative weights are treated as 0). */
export const selectWeightedIndex = <T>(segments: Segment<T>[], rng: () => number): number => {
  if (segments.length === 0) return -1;
  const weights = segments.map((segment) => Math.max(0, segment.weight ?? 1));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  if (totalWeight === 0) {
    return Math.floor(rng() * segments.length);
  }

  let threshold = rng() * totalWeight;
  for (let i = 0; i < segments.length; i += 1) {
    threshold -= weights[i];
    if (threshold <= 0) return i;
  }

  return segments.length - 1;
};

const resolveWinningIndex = <T>(
  segments: Segment<T>[],
  options: SpinOptions,
  rng: () => number,
): number => {
  if (options.targetIndex !== undefined) {
    if (!Number.isInteger(options.targetIndex)) {
      throw new Error("targetIndex must be an integer.");
    }
    if (options.targetIndex < 0 || options.targetIndex >= segments.length) {
      throw new RangeError("targetIndex is out of bounds for segments.");
    }
    return options.targetIndex;
  }

  const selected = selectWeightedIndex(segments, rng);
  if (selected < 0) {
    throw new Error("Cannot select a winning index without segments.");
  }
  return selected;
};

const indexFromAlignmentAngle = (
  alignmentAngle: number,
  pointerAngle: number,
  segmentAngle: number,
  segmentCount: number,
): number => {
  const normalized = normalizeAngle(pointerAngle - alignmentAngle);
  const rawIndex = normalized / segmentAngle;
  const rounded = Math.round(rawIndex) % segmentCount;
  return rounded < 0 ? rounded + segmentCount : rounded;
};

/** Create an initial roulette state from config. */
export const createInitialState = <T>(config: RouletteConfig<T>): RouletteState<T> => {
  const initialAngle = config.startAngle ?? 0;
  return {
    phase: "idle",
    angle: initialAngle,
    elapsedMs: 0,
    durationMs: config.durationMs ?? DEFAULT_DURATION_MS,
    spinStartAngle: initialAngle,
    targetAngle: null,
    winningIndex: null,
    segments: [...config.segments],
  };
};

/**
 * Compute a spin plan (winner, target angle, duration, rotations).
 * Does not mutate state.
 */
export const planSpin = <T>(
  state: RouletteState<T>,
  config: RouletteConfig<T>,
  options: SpinOptions = {},
): SpinPlan => {
  const segments = resolveSegments(state, config);
  if (!segments.length) {
    throw new Error("Roulette requires at least one segment.");
  }

  const rng = resolveRng(config);
  const minRotations = options.minRotations ?? config.minRotations ?? DEFAULT_MIN_ROTATIONS;
  const maxRotations = options.maxRotations ?? config.maxRotations ?? DEFAULT_MAX_ROTATIONS;
  const rotations = pickRandomIntInclusive(minRotations, maxRotations, rng);
  const durationMs = options.durationMs ?? config.durationMs ?? DEFAULT_DURATION_MS;
  const rotationDirection = config.rotationDirection ?? DEFAULT_ROTATION_DIRECTION;
  const pointerAngle = config.pointerAngle ?? DEFAULT_POINTER_ANGLE;
  const segmentAngle = resolveSegmentAngle(segments.length);

  const hasTargetAngle = typeof options.targetAngle === "number";
  let winningIndex = 0;
  let baseAngle = 0;

  if (hasTargetAngle) {
    baseAngle = options.targetAngle as number;
    winningIndex = indexFromAlignmentAngle(baseAngle, pointerAngle, segmentAngle, segments.length);
  } else {
    winningIndex = resolveWinningIndex(segments, options, rng);
    baseAngle = pointerAngle - segmentAngle * winningIndex;

    const jitterFactor = config.jitterFactor ?? DEFAULT_JITTER_FACTOR;
    if (jitterFactor > 0) {
      baseAngle += (rng() - 0.5) * segmentAngle * jitterFactor;
    }
  }

  baseAngle = normalizeAngle(baseAngle);
  const currentAngle = state.angle;
  const currentNormalized = normalizeAngle(currentAngle);

  let delta = 0;
  if (rotationDirection === 1) {
    delta = (baseAngle - currentNormalized + FULL_ROTATION) % FULL_ROTATION;
    delta += rotations * FULL_ROTATION;
  } else {
    delta = -((currentNormalized - baseAngle + FULL_ROTATION) % FULL_ROTATION);
    delta -= rotations * FULL_ROTATION;
  }

  return {
    winningIndex,
    targetAngle: currentAngle + delta,
    durationMs,
    rotations,
  };
};

/** Start a spin using a precomputed plan. */
export const beginSpin = <T>(state: RouletteState<T>, plan: SpinPlan): RouletteState<T> => ({
  ...state,
  phase: "spinning",
  elapsedMs: 0,
  durationMs: plan.durationMs,
  spinStartAngle: state.angle,
  targetAngle: plan.targetAngle,
  winningIndex: plan.winningIndex,
});

/** Advance the spin state by deltaMs (controlled mode). */
export const step = <T>(
  state: RouletteState<T>,
  config: RouletteConfig<T>,
  deltaMs: number,
): RouletteState<T> => {
  if (state.phase !== "spinning" || state.targetAngle === null) return state;

  const duration = Math.max(0, state.durationMs);
  const elapsed = clamp(state.elapsedMs + Math.max(0, deltaMs), 0, duration);
  const t = duration === 0 ? 1 : elapsed / duration;
  const easing = config.easing ?? easeOutCubic;
  const eased = clamp(easing(t), 0, 1);
  const angle = lerp(state.spinStartAngle, state.targetAngle, eased);

  return {
    ...state,
    angle,
    elapsedMs: elapsed,
    phase: t >= 1 ? "stopped" : "spinning",
  };
};
