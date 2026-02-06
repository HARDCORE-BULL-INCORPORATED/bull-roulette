import type {
	RouletteConfig,
	RouletteEngine,
	RouletteEvent,
	RouletteState,
	SpinOptions,
	SpinPlan,
} from "./types";
import { beginSpin, createInitialState, planSpin, step } from "./state";

export const createRouletteEngine = <T>(
	config: RouletteConfig<T>,
): RouletteEngine<T> => {
	let state: RouletteState<T> = createInitialState(config);
	const listeners = new Set<(event: RouletteEvent<T>) => void>();
	let disposed = false;

	const emit = (
		type: RouletteEvent<T>["type"],
		snapshot: RouletteState<T>,
	) => {
		listeners.forEach((listener) => listener({ type, state: snapshot }));
	};

	const getState = () => state;

	const setState = (next: RouletteState<T>) => {
		state = next;
	};

	const setSegments = (segments: RouletteConfig<T>["segments"]) => {
		config.segments = segments;
		state = { ...state, segments: [...segments] };
	};

	const spin = (options: SpinOptions = {}): SpinPlan => {
		if (disposed) throw new Error("Engine is disposed.");
		const plan = planSpin(state, config, options);
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
		dispose,
	};
};
