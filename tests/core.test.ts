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

    it("consecutive seeded spins advance the RNG and can produce different winners", () => {
        const manySegments = Array.from({ length: 10 }, (_, i) => ({
            id: String(i),
            weight: 1,
        }));
        const engine = createRouletteEngine({
            segments: manySegments,
            seed: "deterministic",
            durationMs: 100,
            minRotations: 1,
            maxRotations: 1,
            jitterFactor: 0,
        });

        const winners: number[] = [];
        for (let i = 0; i < 5; i += 1) {
            const plan = engine.spin();
            winners.push(plan.winningIndex);
            // Complete the spin so the engine is ready for the next one
            engine.tick(plan.durationMs);
        }

        const unique = new Set(winners);
        expect(unique.size).toBeGreaterThan(1);
    });

    it("reset returns engine to idle after stopped", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.spin({ targetIndex: 0, durationMs: 100, minRotations: 1, maxRotations: 1 });
        engine.tick(100);
        expect(engine.getState().phase).toBe("stopped");

        engine.reset();
        const state = engine.getState();
        expect(state.phase).toBe("idle");
        expect(state.winningIndex).toBeNull();
        expect(state.targetAngle).toBeNull();
        expect(state.elapsedMs).toBe(0);
    });

    it("reset emits spin:reset event", () => {
        const engine = createRouletteEngine(baseConfig);
        let resets = 0;
        engine.subscribe((event) => {
            if (event.type === "spin:reset") resets += 1;
        });

        engine.spin({ targetIndex: 0, durationMs: 100, minRotations: 1, maxRotations: 1 });
        engine.tick(100);
        engine.reset();
        expect(resets).toBe(1);
    });

    it("reset preserves current segments", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.setSegments([
            { id: "x", weight: 1 },
            { id: "y", weight: 2 },
        ]);
        engine.spin({ targetIndex: 0, durationMs: 100, minRotations: 1, maxRotations: 1 });
        engine.tick(100);
        engine.reset();
        expect(engine.getState().segments).toEqual([
            { id: "x", weight: 1 },
            { id: "y", weight: 2 },
        ]);
    });

    it("reset throws when engine is disposed", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.dispose();
        expect(() => engine.reset()).toThrow("Engine is disposed.");
    });

    it("reset allows spinning again", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.spin({ targetIndex: 1, durationMs: 100, minRotations: 1, maxRotations: 1 });
        engine.tick(100);
        expect(engine.getState().phase).toBe("stopped");

        engine.reset();
        const plan = engine.spin({ targetIndex: 2 });
        expect(plan.winningIndex).toBe(2);
        expect(engine.getState().phase).toBe("spinning");
    });

    it("spinAsync resolves with the plan after spin completes", async () => {
        const engine = createRouletteEngine(baseConfig);
        const promise = engine.spinAsync({
            targetIndex: 1,
            durationMs: 200,
            minRotations: 1,
            maxRotations: 1,
        });

        // Drive the animation to completion
        engine.tick(100);
        engine.tick(100);

        const plan = await promise;
        expect(plan.winningIndex).toBe(1);
        expect(engine.getState().phase).toBe("stopped");
    });

    it("getWinningSegment returns null when idle", () => {
        const engine = createRouletteEngine(baseConfig);
        expect(engine.getWinningSegment()).toBeNull();
    });

    it("getWinningSegment returns the winning segment after spin", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.spin({ targetIndex: 2, durationMs: 100, minRotations: 1, maxRotations: 1 });
        engine.tick(100);
        expect(engine.getState().phase).toBe("stopped");

        const winner = engine.getWinningSegment();
        expect(winner).not.toBeNull();
        expect(winner!.id).toBe("c");
    });

    it("getWinningSegment returns null after reset", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.spin({ targetIndex: 0, durationMs: 100, minRotations: 1, maxRotations: 1 });
        engine.tick(100);
        expect(engine.getWinningSegment()).not.toBeNull();

        engine.reset();
        expect(engine.getWinningSegment()).toBeNull();
    });

    describe("validation", () => {
        it("throws when segments is empty", () => {
            expect(() => createRouletteEngine({ ...baseConfig, segments: [] })).toThrow(
                "Roulette requires at least one segment.",
            );
        });

        it("throws when durationMs is negative", () => {
            expect(() => createRouletteEngine({ ...baseConfig, durationMs: -100 })).toThrow(
                "durationMs must be non-negative.",
            );
            const engine = createRouletteEngine(baseConfig);
            expect(() => engine.spin({ durationMs: -50 })).toThrow(
                "durationMs must be non-negative.",
            );
        });

        it("throws when minRotations > maxRotations", () => {
            expect(() =>
                createRouletteEngine({
                    ...baseConfig,
                    minRotations: 10,
                    maxRotations: 2,
                }),
            ).toThrow("minRotations cannot be greater than maxRotations.");

            const engine = createRouletteEngine(baseConfig);
            expect(() => engine.spin({ minRotations: 10, maxRotations: 2 })).toThrow(
                "minRotations cannot be greater than maxRotations.",
            );
        });

        it("throws when jitterFactor is out of range", () => {
            expect(() => createRouletteEngine({ ...baseConfig, jitterFactor: 5 })).toThrow(
                "jitterFactor must be between 0 and 1.",
            );
            expect(() => createRouletteEngine({ ...baseConfig, jitterFactor: -0.1 })).toThrow(
                "jitterFactor must be between 0 and 1.",
            );
        });

        it("throws when setSegments is called with empty array", () => {
            const engine = createRouletteEngine(baseConfig);
            expect(() => engine.setSegments([])).toThrow("Roulette requires at least one segment.");
        });
    });

    it("engine emits dispose event", () => {
        const engine = createRouletteEngine(baseConfig);
        let disposed = false;
        engine.subscribe((event) => {
            if (event.type === "dispose") disposed = true;
        });
        engine.dispose();
        expect(disposed).toBe(true);
    });
});
