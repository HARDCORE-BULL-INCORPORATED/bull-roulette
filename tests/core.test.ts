import { describe, expect, it } from "bun:test";
import {
    beginSpin,
    createInitialState,
    createRouletteEngine,
    planSpin,
    step,
    selectWeightedIndex,
    normalizeAngle,
    lerp,
    clamp,
    easeOutCubic,
    FULL_ROTATION,
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

describe("math utilities", () => {
    describe("normalizeAngle", () => {
        it("returns 0 for 0", () => {
            expect(normalizeAngle(0)).toBe(0);
        });

        it("returns the same angle for values in [0, 360)", () => {
            expect(normalizeAngle(90)).toBe(90);
            expect(normalizeAngle(359.9)).toBeCloseTo(359.9, 5);
        });

        it("wraps 360 to 0", () => {
            expect(normalizeAngle(360)).toBeCloseTo(0, 10);
        });

        it("wraps angles greater than 360", () => {
            expect(normalizeAngle(450)).toBeCloseTo(90, 10);
            expect(normalizeAngle(720)).toBeCloseTo(0, 10);
        });

        it("normalizes negative angles", () => {
            expect(normalizeAngle(-90)).toBeCloseTo(270, 10);
            expect(normalizeAngle(-360)).toBeCloseTo(0, 10);
            expect(normalizeAngle(-450)).toBeCloseTo(270, 10);
        });

        it("handles very large angles", () => {
            expect(normalizeAngle(3600)).toBeCloseTo(0, 10);
            expect(normalizeAngle(3690)).toBeCloseTo(90, 10);
        });
    });

    describe("lerp", () => {
        it("returns start when t = 0", () => {
            expect(lerp(10, 20, 0)).toBe(10);
        });

        it("returns end when t = 1", () => {
            expect(lerp(10, 20, 1)).toBe(20);
        });

        it("returns midpoint when t = 0.5", () => {
            expect(lerp(0, 100, 0.5)).toBe(50);
        });

        it("handles negative ranges", () => {
            expect(lerp(-10, 10, 0.5)).toBe(0);
        });

        it("extrapolates when t > 1", () => {
            expect(lerp(0, 10, 2)).toBe(20);
        });

        it("extrapolates when t < 0", () => {
            expect(lerp(0, 10, -1)).toBe(-10);
        });

        it("works when start equals end", () => {
            expect(lerp(5, 5, 0.5)).toBe(5);
        });
    });

    describe("clamp", () => {
        it("returns value when within range", () => {
            expect(clamp(5, 0, 10)).toBe(5);
        });

        it("clamps to min when below range", () => {
            expect(clamp(-5, 0, 10)).toBe(0);
        });

        it("clamps to max when above range", () => {
            expect(clamp(15, 0, 10)).toBe(10);
        });

        it("returns min when value equals min", () => {
            expect(clamp(0, 0, 10)).toBe(0);
        });

        it("returns max when value equals max", () => {
            expect(clamp(10, 0, 10)).toBe(10);
        });

        it("works with negative ranges", () => {
            expect(clamp(-5, -10, -1)).toBe(-5);
            expect(clamp(0, -10, -1)).toBe(-1);
            expect(clamp(-15, -10, -1)).toBe(-10);
        });
    });

    describe("easeOutCubic", () => {
        it("returns 0 when t = 0", () => {
            expect(easeOutCubic(0)).toBe(0);
        });

        it("returns 1 when t = 1", () => {
            expect(easeOutCubic(1)).toBe(1);
        });

        it("is monotonically increasing", () => {
            let prev = easeOutCubic(0);
            for (let t = 0.1; t <= 1.0; t += 0.1) {
                const current = easeOutCubic(t);
                expect(current).toBeGreaterThanOrEqual(prev);
                prev = current;
            }
        });

        it("starts fast and decelerates (ease-out shape)", () => {
            // First half should cover more than half the distance
            const halfway = easeOutCubic(0.5);
            expect(halfway).toBeGreaterThan(0.5);
        });
    });

    describe("FULL_ROTATION", () => {
        it("equals 360", () => {
            expect(FULL_ROTATION).toBe(360);
        });
    });
});

describe("dispose prevents further operations", () => {
    it("spin() throws after dispose", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.dispose();
        expect(() => engine.spin()).toThrow("Engine is disposed.");
    });

    it("stopAt() throws after dispose", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.dispose();
        expect(() => engine.stopAt(0)).toThrow("Engine is disposed.");
    });

    it("spinAsync() throws after dispose", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.dispose();
        expect(() => engine.spinAsync()).toThrow("Engine is disposed.");
    });

    it("tick() returns stale state silently after dispose", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.spin({ targetIndex: 0, durationMs: 1000, minRotations: 1, maxRotations: 1 });
        const stateBeforeDispose = engine.getState();
        engine.dispose();

        // tick should not throw, but should not advance state
        const stateAfterTick = engine.tick(100);
        expect(stateAfterTick.angle).toBe(stateBeforeDispose.angle);
        expect(stateAfterTick.elapsedMs).toBe(stateBeforeDispose.elapsedMs);
    });

    it("reset() throws after dispose", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.dispose();
        expect(() => engine.reset()).toThrow("Engine is disposed.");
    });

    it("subscribe() still works but no events are emitted after dispose", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.dispose();
        // Listeners were cleared on dispose, new subscriptions still possible
        // but since spin/tick throw or no-op, no events fire
        let events = 0;
        engine.subscribe(() => {
            events += 1;
        });

        // tick won't emit because disposed
        engine.tick(100);
        expect(events).toBe(0);
    });

    it("double dispose does not throw", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.dispose();
        expect(() => engine.dispose()).not.toThrow();
    });
});

describe("rotationDirection: -1 with imperative engine", () => {
    const reverseConfig: RouletteConfig = {
        ...baseConfig,
        rotationDirection: -1,
        minRotations: 2,
        maxRotations: 2,
    };

    it("angle decreases during spin", () => {
        const engine = createRouletteEngine(reverseConfig);
        engine.spin({ targetIndex: 1, durationMs: 500, minRotations: 2, maxRotations: 2 });

        const initialAngle = engine.getState().angle;
        engine.tick(100);
        const midAngle = engine.getState().angle;

        // With reverse rotation, the target angle is negative, so angle should decrease
        expect(midAngle).toBeLessThan(initialAngle);
    });

    it("completes to the correct winning index", () => {
        const engine = createRouletteEngine(reverseConfig);
        const plan = engine.spin({
            targetIndex: 2,
            durationMs: 200,
            minRotations: 1,
            maxRotations: 1,
        });

        // Drive to completion
        engine.tick(200);
        expect(engine.getState().phase).toBe("stopped");
        expect(engine.getState().winningIndex).toBe(2);
        expect(plan.targetAngle).toBeLessThan(0);
    });

    it("emits lifecycle events with reverse rotation", () => {
        const engine = createRouletteEngine(reverseConfig);
        let starts = 0;
        let completes = 0;
        engine.subscribe((event) => {
            if (event.type === "spin:start") starts += 1;
            if (event.type === "spin:complete") completes += 1;
        });

        engine.spin({ targetIndex: 0, durationMs: 100, minRotations: 1, maxRotations: 1 });
        engine.tick(100);

        expect(starts).toBe(1);
        expect(completes).toBe(1);
    });
});

describe("re-spinning while already spinning", () => {
    it("overwrites the current spin with a new one", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.spin({ targetIndex: 0, durationMs: 1000, minRotations: 3, maxRotations: 3 });
        engine.tick(100); // partially through spin

        expect(engine.getState().phase).toBe("spinning");

        // Re-spin mid-animation targeting a different segment
        const newPlan = engine.spin({
            targetIndex: 2,
            durationMs: 500,
            minRotations: 1,
            maxRotations: 1,
        });

        expect(engine.getState().phase).toBe("spinning");
        expect(engine.getState().winningIndex).toBe(2);
        expect(newPlan.winningIndex).toBe(2);

        // Drive to completion
        engine.tick(500);
        expect(engine.getState().phase).toBe("stopped");
        expect(engine.getState().winningIndex).toBe(2);
    });

    it("emits spin:start for each spin call", () => {
        const engine = createRouletteEngine(baseConfig);
        let starts = 0;
        engine.subscribe((event) => {
            if (event.type === "spin:start") starts += 1;
        });

        engine.spin({ targetIndex: 0, durationMs: 1000, minRotations: 1, maxRotations: 1 });
        engine.tick(100);
        engine.spin({ targetIndex: 1, durationMs: 500, minRotations: 1, maxRotations: 1 });

        expect(starts).toBe(2);
    });

    it("uses the mid-spin angle as the new start angle", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.spin({ targetIndex: 0, durationMs: 1000, minRotations: 3, maxRotations: 3 });
        engine.tick(200);

        const midAngle = engine.getState().angle;
        expect(midAngle).not.toBe(0); // Should have moved from initial

        engine.spin({ targetIndex: 1, durationMs: 500, minRotations: 1, maxRotations: 1 });
        expect(engine.getState().spinStartAngle).toBe(midAngle);
    });
});

describe("negative deltaMs to tick", () => {
    it("step clamps negative delta to 0 (no backward progress)", () => {
        const config = { ...baseConfig, durationMs: 1000 };
        const initial = createInitialState(config);
        const plan = planSpin(initial, config, { targetIndex: 0 });
        let state = beginSpin(initial, plan);

        // Advance partially
        state = step(state, config, 300);
        expect(state.elapsedMs).toBe(300);

        // Negative delta should not rewind
        const stateAfterNeg = step(state, config, -100);
        expect(stateAfterNeg.elapsedMs).toBe(300);
    });

    it("engine.tick with negative delta does not rewind", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.spin({ targetIndex: 1, durationMs: 1000, minRotations: 1, maxRotations: 1 });
        engine.tick(300);
        const elapsed = engine.getState().elapsedMs;

        engine.tick(-200);
        expect(engine.getState().elapsedMs).toBe(elapsed);
    });

    it("engine.tick(0) does not advance", () => {
        const engine = createRouletteEngine(baseConfig);
        engine.spin({ targetIndex: 0, durationMs: 1000, minRotations: 1, maxRotations: 1 });
        engine.tick(0);
        expect(engine.getState().elapsedMs).toBe(0);
        expect(engine.getState().phase).toBe("spinning");
    });
});
