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
        expect(store.getState().phase).toBe("stopped");
    });
});
