# roulette

Framework-agnostic, headless roulette engine with optional React and Svelte adapters. No DOM usage in the core, SSR-safe.

## Install

```bash
npm install roulette
```

```bash
bun add roulette
```

## Core Usage (Headless)

```ts
import { createRouletteEngine } from "roulette";

const engine = createRouletteEngine({
	segments: [
		{ id: "a", weight: 1 },
		{ id: "b", weight: 2 },
		{ id: "c", weight: 3 },
	],
	durationMs: 4000,
	minRotations: 3,
	maxRotations: 5,
});

engine.subscribe((event) => {
	if (event.type === "spin:complete") {
		console.log("Winner index:", event.state.winningIndex);
	}
});

engine.spin();
// call engine.tick(deltaMs) from your animation loop
```

## Controlled Mode

```ts
import { createInitialState, planSpin, beginSpin, step } from "roulette";

const config = { segments: [{ id: "a" }, { id: "b" }] };
let state = createInitialState(config);
const plan = planSpin(state, config);
state = beginSpin(state, plan);

// In your loop
state = step(state, config, 16.7);
```

## React Adapter (Optional)

```ts
import { useRoulette } from "roulette/react";

const { state, spin, tick } = useRoulette({ segments: [{ id: "a" }] });
```

## Svelte Adapter (Optional)

```ts
import { createRouletteStore } from "roulette/svelte";

const roulette = createRouletteStore({ segments: [{ id: "a" }] });
```

## Deterministic RNG (Optional)

Provide a `seed` for deterministic spins:

```ts
const engine = createRouletteEngine({
	segments: [{ id: "a" }, { id: "b" }],
	seed: "my-seed",
});
```

## SSR

- The core is SSR-safe (no DOM access).
- Adapters are also SSR-safe as long as you avoid calling tick/spin during SSR.

## Build

```bash
bun run build
```

## Tests

```bash
bun test
```

## Notes

- Renderers (canvas/DOM/SVG) are intentionally out of scope for v1 and can be added later.
