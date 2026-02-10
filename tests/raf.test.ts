import { describe, expect, it, mock } from "bun:test";
import { createRouletteEngine } from "../src/core";

const segments = [{ id: "a", weight: 1 }];
const baseConfig = { segments, durationMs: 1000 };

describe("roulette rAF loop", () => {
    it("start() and stop() are safe when window is undefined", () => {
        const engine = createRouletteEngine(baseConfig);
        expect(() => engine.start()).not.toThrow();
        expect(() => engine.stop()).not.toThrow();
    });

    it("start() starts the rAF loop when window exists", () => {
        const originalRAF = globalThis.requestAnimationFrame;
        const originalCAF = globalThis.cancelAnimationFrame;

        let rafCallback: ((time: number) => void) | null = null;
        let rafIdCounter = 0;

        // Mock requestAnimationFrame
        (globalThis as any).requestAnimationFrame = mock((cb) => {
            rafCallback = cb;
            return ++rafIdCounter;
        });

        (globalThis as any).cancelAnimationFrame = mock(() => {});
        (globalThis as any).window = globalThis;

        try {
            const engine = createRouletteEngine(baseConfig);
            let ticks = 0;
            engine.subscribe((event) => {
                if (event.type === "spin:tick") {
                    ticks++;
                }
            });

            // Start spinning so tick emits events
            engine.spin();

            engine.start();
            expect(globalThis.requestAnimationFrame).toHaveBeenCalled();

            if (rafCallback) {
                // First call to loop sets lastTime
                (rafCallback as any)(100);
                expect(ticks).toBe(0);

                // Second call should trigger tick
                if (rafCallback) (rafCallback as any)(116); // ~16ms later
                expect(ticks).toBe(1);
            }

            engine.stop();
            expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
        } finally {
            (globalThis as any).requestAnimationFrame = originalRAF;
            (globalThis as any).cancelAnimationFrame = originalCAF;
            // @ts-ignore
            delete globalThis.window;
        }
    });
});
