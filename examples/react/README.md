# bull-roulette React Example

This example demonstrates using the headless engine via the React adapter.

## Setup

Build the library once before running the example:

```bash
cd /Users/kristjan/Documents/github/roulette
bun run build
```

Install deps and run:

```bash
cd /Users/kristjan/Documents/github/roulette/examples/react
bun install
bun run dev
```

If you update the library source, rebuild it (`bun run build`) to refresh the example.

Example usage lives in `src/App.tsx`.

Routes:

- `/` headless demo
- `/spin` spinning animation demo
- `/slots` slot-machine demo
