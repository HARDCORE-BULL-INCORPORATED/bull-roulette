import { readable } from "svelte/store";
import type {
    RouletteConfig,
    RouletteEngine,
    RouletteEvent,
    RouletteState,
    SpinOptions,
    SpinPlan,
} from "../core/types";
import { createRouletteEngine } from "../core/engine";

/** Svelte store interface for the roulette engine. */
export type RouletteStore<T> = {
    subscribe: (run: (state: RouletteState<T>) => void) => () => void;
    engine: RouletteEngine<T>;
    spin: (options?: SpinOptions) => SpinPlan;
    stopAt: (index: number) => SpinPlan;
    tick: (deltaMs: number) => RouletteState<T>;
    getState: () => RouletteState<T>;
    setSegments: (segments: RouletteConfig<T>["segments"]) => void;
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
            engine.dispose();
        };
    });

    return {
        subscribe: store.subscribe,
        engine,
        spin: engine.spin,
        stopAt: engine.stopAt,
        tick: engine.tick,
        getState: engine.getState,
        setSegments: engine.setSegments,
    };
};
