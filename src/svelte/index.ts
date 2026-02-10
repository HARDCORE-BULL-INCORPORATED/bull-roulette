import { readable } from "svelte/store";
import type {
    RouletteConfig,
    RouletteEngine,
    RouletteEvent,
    RouletteState,
    Segment,
    SpinOptions,
    SpinPlan,
} from "../core/types";
import { createRouletteEngine } from "../core/engine";

/** Svelte store interface for the roulette engine. */
export type RouletteStore<T> = {
    subscribe: (run: (state: RouletteState<T>) => void) => () => void;
    engine: RouletteEngine<T>;
    spin: (options?: SpinOptions) => SpinPlan;
    spinAsync: (options?: SpinOptions) => Promise<SpinPlan>;
    stopAt: (index: number) => SpinPlan;
    tick: (deltaMs: number) => RouletteState<T>;
    getState: () => RouletteState<T>;
    getWinningSegment: () => Segment<T> | null;
    setSegments: (segments: RouletteConfig<T>["segments"]) => void;
    reset: () => void;
};

/** Svelte store wrapper around the headless roulette engine. */
export const createRouletteStore = <T>(config: RouletteConfig<T>): RouletteStore<T> => {
    const engine = createRouletteEngine(config);

    const store = readable<RouletteState<T>>(engine.getState(), (set) => {
        const unsubscribe = engine.subscribe((event: RouletteEvent<T>) => {
            if (
                event.type === "spin:tick" ||
                event.type === "spin:start" ||
                event.type === "spin:complete"
            ) {
                set(event.state);
            }
        });

        return () => {
            unsubscribe();
        };
    });

    return {
        subscribe: store.subscribe,
        engine,
        spin: engine.spin,
        spinAsync: engine.spinAsync,
        stopAt: engine.stopAt,
        tick: engine.tick,
        getState: engine.getState,
        getWinningSegment: engine.getWinningSegment,
        setSegments: engine.setSegments,
        reset: engine.reset,
    };
};
