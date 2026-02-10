import type {
    RouletteConfig,
    RouletteEngine,
    RouletteEvent,
    RouletteState,
    SpinOptions,
    SpinPlan,
} from "./types";
import { beginSpin, createInitialState, planSpin, resolveRng, step } from "./state";

/**
 * Create an imperative roulette engine instance.
 *
 * @param config Configuration for spin behavior and selection.
 * Required:
 * - `segments`: array of segments to select from.
 *
 * Common options:
 * - `durationMs`, `minRotations`, `maxRotations` control timing/rotations.
 * - `pointerAngle` and `startAngle` control alignment and initial angle.
 * - `seed` or `rng` control determinism.
 *
 * @returns Engine with imperative methods:
 * - `spin(options?)`: start a spin and return the computed plan.
 * - `stopAt(index)`: spin to a specific winning index.
 * - `tick(deltaMs)`: advance the animation by deltaMs.
 * - `getState()` / `setState(state)`: read or replace state.
 * - `setSegments(segments)`: replace the segment list.
 * - `subscribe(listener)`: listen to spin lifecycle events.
 * - `reset()`: return to idle state and emit `spin:reset`.
 * - `dispose()`: remove listeners and disable the engine.
 */
export const createRouletteEngine = <T>(initialConfig: RouletteConfig<T>): RouletteEngine<T> => {
    const config = { ...initialConfig };
    const rng = resolveRng(config);
    let state: RouletteState<T> = createInitialState(config);
    const listeners = new Set<(event: RouletteEvent<T>) => void>();
    let disposed = false;

    const emit = (type: RouletteEvent<T>["type"], snapshot: RouletteState<T>) => {
        listeners.forEach((listener) => listener({ type, state: snapshot }));
    };

    const getState = () => state;

    const setState = (next: RouletteState<T>) => {
        state = next;
    };

    const setSegments = (segments: RouletteConfig<T>["segments"]) => {
        const copy = [...segments];
        config.segments = copy;
        state = { ...state, segments: copy };
    };

    const spin = (options: SpinOptions = {}): SpinPlan => {
        if (disposed) throw new Error("Engine is disposed.");
        const plan = planSpin(state, config, options, rng);
        state = beginSpin(state, plan);
        emit("spin:start", state);
        return plan;
    };

    const stopAt = (index: number): SpinPlan => spin({ targetIndex: index });

    const tick = (deltaMs: number): RouletteState<T> => {
        if (disposed) return state;
        const prevPhase = state.phase;
        state = step(state, config, deltaMs);
        if (state.phase === "spinning") {
            emit("spin:tick", state);
        }
        if (prevPhase === "spinning" && state.phase === "stopped") {
            emit("spin:complete", state);
        }
        return state;
    };

    const subscribe = (listener: (event: RouletteEvent<T>) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };

    const reset = () => {
        if (disposed) throw new Error("Engine is disposed.");
        state = { ...createInitialState(config), segments: [...config.segments] };
        emit("spin:reset", state);
    };

    const dispose = () => {
        listeners.clear();
        disposed = true;
    };

    return {
        getState,
        setState,
        setSegments,
        spin,
        stopAt,
        tick,
        subscribe,
        reset,
        dispose,
    };
};
