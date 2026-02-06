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
        engine.spin({
            targetIndex: 1,
            minRotations: 3,
            maxRotations: 3,
            durationMs: 1000,
        });

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
        const hasWindow = "window" in globalThis;
        expect(hasWindow).toBe(false);
        const engine = createRouletteEngine(baseConfig);
        expect(engine.getState().phase).toBe("idle");
    });

    it("selectWeightedIndex ignores negative weights", () => {
        const rng = () => 0.1;
        const index = selectWeightedIndex(
            [
                { id: "x", weight: -5 },
                { id: "y", weight: 0 },
                { id: "z", weight: 1 },
            ],
            rng,
        );
        expect(index).toBe(2);
    });

    it("planSpin throws when no segments provided", () => {
        const config = { ...baseConfig, segments: [] };
        const state = createInitialState(config);
        expect(() => planSpin(state, config)).toThrow();
    });

    it("planSpin validates targetIndex bounds", () => {
        const state = createInitialState(baseConfig);
        expect(() => planSpin(state, baseConfig, { targetIndex: -1 })).toThrow();
        expect(() => planSpin(state, baseConfig, { targetIndex: 10 })).toThrow();
    });

    it("planSpin honors targetAngle alignment", () => {
        const config = {
            ...baseConfig,
            segments: [
                { id: "a", weight: 1 },
                { id: "b", weight: 1 },
                { id: "c", weight: 1 },
                { id: "d", weight: 1 },
            ],
        };
        const state = createInitialState(config);
        const plan = planSpin(state, config, { targetAngle: 90 });
        expect(plan.winningIndex).toBe(3);
    });

    it("rotationDirection -1 spins in reverse", () => {
        const config = {
            ...baseConfig,
            rotationDirection: -1 as const,
            minRotations: 1,
            maxRotations: 1,
        };
        const state = createInitialState(config);
        const plan = planSpin(state, config, { targetIndex: 0 });
        expect(plan.targetAngle).toBeLessThan(state.angle);
    });

    it("rng overrides seed when provided", () => {
        const config = {
            ...baseConfig,
            seed: "seed",
            rng: () => 0.99,
        };
        const state = createInitialState(config);
        const plan = planSpin(state, config);
        expect(plan.winningIndex).toBe(2);
    });

    it("step completes immediately when duration is zero", () => {
        const config = { ...baseConfig, durationMs: 0 };
        const initial = createInitialState(config);
        const plan = planSpin(initial, config, {
            targetIndex: 2,
            durationMs: 0,
        });
        const spinning = beginSpin(initial, plan);
        const next = step(spinning, config, 0);
        expect(next.phase).toBe("stopped");
    });

    it("engine emits lifecycle events", () => {
        const engine = createRouletteEngine(baseConfig);
        let starts = 0;
        let ticks = 0;
        let completes = 0;
        engine.subscribe((event) => {
            if (event.type === "spin:start") starts += 1;
            if (event.type === "spin:tick") ticks += 1;
            if (event.type === "spin:complete") completes += 1;
        });
        engine.spin({
            targetIndex: 1,
            minRotations: 1,
            maxRotations: 1,
            durationMs: 200,
        });
        engine.tick(100);
        engine.tick(100);
        expect(starts).toBe(1);
        expect(ticks).toBeGreaterThan(0);
        expect(completes).toBe(1);
    });

    it("setSegments updates engine state", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.setSegments([{ id: "x", weight: 1 }]);
        expect(engine.getState().segments.length).toBe(1);
    });

    it("setState replaces engine state", () => {
        const engine = createRouletteEngine(baseConfig);
        const state = engine.getState();
        engine.setState({ ...state, angle: 123, phase: "stopped" });
        expect(engine.getState().angle).toBe(123);
        expect(engine.getState().phase).toBe("stopped");
    });
});
