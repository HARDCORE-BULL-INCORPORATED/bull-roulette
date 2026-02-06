# Roulette Library Plan

## Scope Decisions
- Framework-agnostic headless core.
- React/Svelte adapters only (no renderer included).
- Deterministic RNG only when seed provided.
- SSR-safe core (no DOM usage).
- Build with Bun.
- Future: optional renderer plugins (canvas/DOM/SVG) can be added later.

## Phase 1 — Audit & Extraction
1. Review SolidJS code in `/Users/kristjan/Documents/github/roulette/roulette/CaseRoulette.tsx`.
2. Pull spin/physics logic and types from `/Users/kristjan/Documents/github/roulette/roulette/utils.ts` and `/Users/kristjan/Documents/github/roulette/roulette/types.ts`.
3. Identify core logic that can be made pure and framework-agnostic.

## Phase 2 — Core API Design
1. Define types: `Segment`, `RouletteConfig`, `RouletteState`, `SpinOptions`, `Events`.
2. Design two usage modes:
3. Controlled: pure reducer `step(state, dt, config)` and `createInitialState(config)`.
4. Imperative: `createRouletteEngine(config)` returns methods.
5. Deterministic RNG only when `seed` is provided; otherwise use `Math.random`.

## Phase 3 — Core Implementation
1. Create `src/core/engine.ts` with:
2. `createRouletteEngine`, `spin`, `stopAt`, `tick`, `getState`, `setState`, `subscribe`, `dispose`.
3. Create `src/core/state.ts` with:
4. `createInitialState`, `step`, `resolveTarget`.
5. Ensure zero DOM access for SSR safety.

## Phase 4 — Adapters
1. React adapter in `/Users/kristjan/Documents/github/roulette/src/react/index.ts`:
2. `useRoulette(config)` hook returning imperative engine + derived state.
3. Svelte adapter in `/Users/kristjan/Documents/github/roulette/src/svelte/index.ts`:
4. Store wrapper around the engine.
5. No renderers (canvas/DOM) now.
6. Add note in docs for future renderer plugins.

## Phase 5 — Packaging with Bun
1. Create `src/index.ts` to export core and adapters.
2. Build ESM and CJS using Bun.
3. Emit types via `tsc --emitDeclarationOnly`.
4. Update `/Users/kristjan/Documents/github/roulette/package.json`:
5. `exports` map for `/core`, `/react`, `/svelte`, root.
6. `peerDependencies` for `react` and `svelte` marked optional.

## Phase 6 — Tests
1. Core engine deterministic behavior with seeded RNG.
2. Controlled vs imperative equivalence.
3. Stop target accuracy and duration constraints.
4. SSR safety test that imports core without `window`.

## Phase 7 — Docs
1. Update `/Users/kristjan/Documents/github/roulette/README.md`:
2. Quickstart for core.
3. Controlled vs imperative usage.
4. React and Svelte examples.
5. SSR notes.
6. Future: renderer adapters (canvas/DOM/SVG).

## Phase 8 — Release
1. Build with Bun.
2. Verify package contents via `npm pack`.
3. Publish.
