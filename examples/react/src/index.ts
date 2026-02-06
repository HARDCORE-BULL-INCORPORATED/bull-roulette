import { createRouletteEngine } from "bull-roulette";

const engine = createRouletteEngine({
  segments: [
    { id: "a", weight: 1 },
    { id: "b", weight: 2 },
    { id: "c", weight: 3 },
  ],
  durationMs: 1000,
  minRotations: 2,
  maxRotations: 2,
  jitterFactor: 0,
});

engine.subscribe((event) => {
  if (event.type === "spin:complete") {
    console.log("Winner:", event.state.winningIndex);
  }
});

engine.spin();
for (let i = 0; i < 10; i += 1) engine.tick(100);
