import { describe, expect, it } from "bun:test";
import { createRouletteStore } from "../src/svelte";

const config = {
    segments: [{ id: "a" }, { id: "b" }, { id: "c" }],
    durationMs: 200,
    minRotations: 1,
    maxRotations: 1,
    jitterFactor: 0,
};

describe("svelte adapter", () => {
    it("emits state updates on spin and tick", () => {
        const store = createRouletteStore(config);
        const states: string[] = [];
        const unsubscribe = store.subscribe((state) => {
            states.push(state.phase);
        });

        store.spin({
            targetIndex: 1,
            durationMs: 200,
            minRotations: 1,
            maxRotations: 1,
        });
        store.tick(100);
        store.tick(100);

        unsubscribe();

        expect(states.length).toBeGreaterThan(0);
    });

    it("allows re-subscription and spin after all subscribers leave", () => {
        const store = createRouletteStore(config);

        // First subscription
        const unsubscribe1 = store.subscribe(() => {});
        unsubscribe1(); // Last subscriber leaves, cleanup fires

        // Should NOT be disposed, so spin should work
        expect(() =>
            store.spin({
                targetIndex: 1,
            }),
        ).not.toThrow();

        expect(store.getState().phase).toBe("spinning");
    });

    it("initializes with correct state from config", () => {
        const store = createRouletteStore({ ...config, startAngle: 123 });
        const state = store.getState();
        expect(state.angle).toBe(123);
        expect(state.phase).toBe("idle");
        expect(state.segments.length).toBe(3);
    });

    it("exposes all engine methods", () => {
        const store = createRouletteStore(config);
        expect(typeof store.spin).toBe("function");
        expect(typeof store.spinAsync).toBe("function");
        expect(typeof store.tick).toBe("function");
        expect(typeof store.stopAt).toBe("function");
        expect(typeof store.reset).toBe("function");
        expect(typeof store.getWinningSegment).toBe("function");
        expect(typeof store.setSegments).toBe("function");
    });

    it("getWinningSegment returns null initially and correct segment after spin", () => {
        const store = createRouletteStore(config);
        expect(store.getWinningSegment()).toBeNull();

        store.spin({ targetIndex: 2, durationMs: 100, minRotations: 1, maxRotations: 1 });
        store.tick(100);

        const winner = store.getWinningSegment();
        expect(winner).not.toBeNull();
        expect(winner!.id).toBe("c");
    });

    it("engine is exposed on the store", () => {
        const store = createRouletteStore(config);
        expect(store.engine).toBeDefined();
        expect(typeof store.engine.dispose).toBe("function");
    });

    it("updates segments via setSegments", () => {
        const store = createRouletteStore(config);
        store.setSegments([{ id: "new", weight: 1 }]);
        expect(store.getState().segments.length).toBe(1);
        expect(store.getState().segments[0].id).toBe("new");
    });
});
