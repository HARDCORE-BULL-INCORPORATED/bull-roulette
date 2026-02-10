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
});
