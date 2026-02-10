# Roulette Library — Improvement Plan

Bugs, additions, and refactors identified from a full audit of `src/`.

---

## Bugs

### 1. Engine mutates caller's `config` object

`setSegments` in `engine.ts:48` writes directly to `config.segments`, leaking side effects to the caller's original object. The engine should maintain its own internal copy of the config.

### 2. Seeded RNG resets on every `planSpin` call

`resolveRng(config)` is called inside `planSpin`, creating a fresh RNG from the seed each time. This means consecutive spins with the same seed always pick the same winner — the RNG sequence never advances between spins.

**Fix:** Resolve the RNG once at engine creation and persist the closure so consecutive calls advance the sequence.

### 3. React adapter `getSnapshot` crashes after dispose

`getSnapshot` is memoized with `[]` deps and reads from `engineRef.current`. After disposal sets `engineRef.current = null`, `getSnapshot` returns `null` cast to `RouletteState<T>`, causing runtime errors on `.phase`, `.angle`, etc.

### 4. React adapter deferred dispose → use-after-dispose window

`setTimeout(() => { engine.dispose(); engine = null; }, 0)` — during the 0ms window a callback can still call `spin()` on a live engine that is about to be disposed underneath it.

### 5. Svelte adapter disposes engine when last subscriber leaves

The `readable` cleanup function calls `engine.dispose()`. If a Svelte component unmounts and remounts (e.g. `{#if}`), the store's cleanup fires, permanently disposing the engine. Subsequent `spin()` calls throw `"Engine is disposed."`.

### 6. `selectWeightedIndex` off-by-one bias

`threshold <= 0` (not `< 0`) means values exactly at a boundary get attributed to the current segment. Combined with `rng() * totalWeight` being able to return 0, segment 0 has a marginally higher probability.

---

## Additions

### 7. `reset()` method on the engine

No way to return to `"idle"` after `"stopped"`. Users must manually `setState(createInitialState(config))`.

### 8. `spin:reset` event

No lifecycle event for when the engine returns to idle — useful for UI cleanup.

### 9. Promise-based `spin()` / `onComplete` callback

No ergonomic way to `await` a spin. A `spin()` returning `Promise<SpinPlan>` would help non-animation use cases (server-side prize selection).

### 10. `getWinningSegment()` convenience

Users always do `segments[state.winningIndex!]`. A helper returning the `Segment<T>` or `null` would reduce boilerplate.

### 11. Config validation at creation time

No validation. `segments: []`, `durationMs: -100`, `minRotations: 10, maxRotations: 2`, `jitterFactor: 5` all silently produce broken behavior.

### 12. `dispose` event

No lifecycle event on `dispose()`. Adapters can't know when to clean up.

### 13. Export `createSeededRng` and math utilities

`createSeededRng`, `normalizeAngle`, `easeOutCubic`, etc. are useful for custom renderers but not exported from the core barrel.

### 14. Built-in `requestAnimationFrame` tick loop

Many users will write the same `rAF` → `tick(delta)` loop. A built-in `engine.start()` / `engine.stop()` with a browser guard (SSR safety) would be a common convenience.

### 15. Svelte 5 runes adapter

Current adapter uses `svelte/store` (Svelte 4). A Svelte 5 runes-based adapter using `$state` would modernize support.

### 16. Vue adapter

A `useRoulette` composable would round out framework support alongside React and Svelte.

---

## Refactors

### 17. Internal config copy (relates to bug #1)

All engine internals should work on a shallow copy so the caller's object stays clean.

### 18. Persist RNG state across spins (relates to bug #2)

Resolve the RNG once in `createRouletteEngine` and store the closure.

### 19. Extract `resolveConfig()` helper

Defaults are scattered across `state.ts` and re-resolved on every `planSpin`. Centralize into `resolveConfig(partial) → ResolvedRouletteConfig`.

### 20. Defensive state snapshot in `emit`

`emit` passes the `state` reference directly to listeners. While reassignment (not mutation) makes this safe today, a `{ ...snapshot }` copy would be more robust long-term.

### 21. Test coverage gaps

- No test for `dispose()` preventing further spins.
- No test for `normalizeAngle` / `lerp` / `clamp` directly.
- No test for `rotationDirection: -1` with the imperative engine.
- No test for re-spinning while already `"spinning"`.
- No test for negative `deltaMs` to `tick()`.
- React and Svelte adapter tests are very thin (1 test each).

### 22. Export `RouletteEventType` string literal union

A standalone `type RouletteEventType = "spin:start" | "spin:tick" | "spin:complete"` would let consumers reference event types without string literals.
