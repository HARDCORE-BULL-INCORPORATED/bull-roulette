import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type {
    RouletteConfig,
    RouletteEngine,
    RouletteEvent,
    RouletteState,
    SpinOptions,
    SpinPlan,
} from "../core/types";
import { createRouletteEngine } from "../core/engine";

/** Return value for the useRoulette hook. */
export type UseRouletteResult<T> = {
    state: RouletteState<T>;
    engine: RouletteEngine<T>;
    spin: (options?: SpinOptions) => SpinPlan;
    stopAt: (index: number) => SpinPlan;
    tick: (deltaMs: number) => RouletteState<T>;
    getState: () => RouletteState<T>;
};

const applyConfig = <T>(target: RouletteConfig<T>, source: RouletteConfig<T>) => {
    target.segments = source.segments;
    target.minRotations = source.minRotations;
    target.maxRotations = source.maxRotations;
    target.rotationDirection = source.rotationDirection;
    target.pointerAngle = source.pointerAngle;
    target.startAngle = source.startAngle;
    target.durationMs = source.durationMs;
    target.easing = source.easing;
    target.jitterFactor = source.jitterFactor;
    target.seed = source.seed;
    target.rng = source.rng;
};

/** React hook wrapper around the headless roulette engine. */
export const useRoulette = <T>(config: RouletteConfig<T>): UseRouletteResult<T> => {
    const configRef = useRef<RouletteConfig<T>>({ ...config });
    const engineRef = useRef<RouletteEngine<T> | null>(null);
    const disposeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fallbackStateRef = useRef<RouletteState<T> | null>(null);
    const unmountedRef = useRef(false);

    if (!engineRef.current) {
        configRef.current = {
            ...configRef.current,
            segments: [...configRef.current.segments],
        };
        engineRef.current = createRouletteEngine(configRef.current);
        fallbackStateRef.current = engineRef.current.getState();
    }

    useEffect(() => {
        applyConfig(configRef.current, config);
        engineRef.current?.setSegments(config.segments);
    }, [config]);

    useEffect(() => {
        unmountedRef.current = false;

        if (disposeTimerRef.current !== null) {
            clearTimeout(disposeTimerRef.current);
            disposeTimerRef.current = null;
        }

        return () => {
            unmountedRef.current = true;

            disposeTimerRef.current = setTimeout(() => {
                engineRef.current?.dispose();
                engineRef.current = null;
            }, 0);
        };
    }, []);

    const subscribe = useMemo(() => {
        return (listener: () => void) => {
            const handle = (event: RouletteEvent<T>) => {
                if (
                    event.type === "spin:tick" ||
                    event.type === "spin:start" ||
                    event.type === "spin:complete"
                ) {
                    listener();
                }
            };
            return engineRef.current?.subscribe(handle) ?? (() => undefined);
        };
    }, []);

    const getSnapshot = useMemo(
        () => () => engineRef.current?.getState() ?? fallbackStateRef.current!,
        [],
    );

    const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    return useMemo(() => {
        const engine = engineRef.current as RouletteEngine<T>;

        const guardDisposed = (name: string) => {
            if (unmountedRef.current) {
                throw new Error(`Cannot call ${name}() on an unmounted roulette engine.`);
            }
        };

        return {
            state,
            engine,
            spin: (options?: SpinOptions) => {
                guardDisposed("spin");
                return engine.spin(options);
            },
            stopAt: (index: number) => {
                guardDisposed("stopAt");
                return engine.stopAt(index);
            },
            tick: (deltaMs: number) => {
                guardDisposed("tick");
                return engine.tick(deltaMs);
            },
            getState: engine.getState,
        };
    }, [state]);
};
