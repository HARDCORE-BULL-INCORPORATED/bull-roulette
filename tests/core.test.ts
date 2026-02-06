import { describe, expect, it } from "bun:test";
import {
	beginSpin,
	createInitialState,
	createRouletteEngine,
	planSpin,
	step,
	selectWeightedIndex,
} from "../src/core";
import type { RouletteConfig } from "../src/core";

const segments = [
	{ id: "a", weight: 1 },
	{ id: "b", weight: 2 },
	{ id: "c", weight: 3 },
];

const baseConfig: RouletteConfig = {
	segments,
	minRotations: 3,
	maxRotations: 3,
	durationMs: 1000,
	jitterFactor: 0,
};

describe("roulette core", () => {
	it("selectWeightedIndex falls back to uniform when all weights are zero", () => {
		const zeroSegments = [
			{ id: "x", weight: 0 },
			{ id: "y", weight: 0 },
		];
		const rng = () => 0.75;
		const index = selectWeightedIndex(zeroSegments, rng);
		expect(index).toBe(1);
	});

	it("planSpin is deterministic with seed", () => {
		const configA = { ...baseConfig, seed: "seed" };
		const configB = { ...baseConfig, seed: "seed" };
		const stateA = createInitialState(configA);
		const stateB = createInitialState(configB);
		const planA = planSpin(stateA, configA);
		const planB = planSpin(stateB, configB);
		expect(planA).toEqual(planB);
	});

	it("controlled step matches imperative engine", () => {
		const config = { ...baseConfig };
		const initial = createInitialState(config);
		const plan = planSpin(initial, config, { targetIndex: 1 });
		let controlled = beginSpin(initial, plan);
		const engine = createRouletteEngine(config);
		engine.setState(initial);
		engine.spin({ targetIndex: 1, minRotations: 3, maxRotations: 3, durationMs: 1000 });

		for (let i = 0; i < 10; i += 1) {
			controlled = step(controlled, config, 100);
			engine.tick(100);
		}

		const engineState = engine.getState();
		expect(engineState.winningIndex).toBe(1);
		expect(controlled.winningIndex).toBe(1);
		expect(engineState.angle).toBeCloseTo(controlled.angle, 6);
	});

	it("stopAt plans a spin to the provided index", () => {
		const engine = createRouletteEngine(baseConfig);
		const plan = engine.stopAt(2);
		expect(plan.winningIndex).toBe(2);
	});

	it("core imports without DOM access", () => {
		expect(typeof window).toBe("undefined");
		const engine = createRouletteEngine(baseConfig);
		expect(engine.getState().phase).toBe("idle");
	});
});
