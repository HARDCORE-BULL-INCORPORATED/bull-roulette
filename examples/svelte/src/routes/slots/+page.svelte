<script lang="ts">
	import { onDestroy } from "svelte";
	import { createRouletteStore } from "bull-roulette/svelte";

	const symbols = ["🍒", "🔔", "⭐", "7", "🍋"];
	const itemSize = 72;

	const config = {
		segments: symbols.map((symbol) => ({ id: symbol })),
		durationMs: 2200,
		minRotations: 4,
		maxRotations: 6,
		jitterFactor: 0.1,
	};

	const left = createRouletteStore(config);
	const right = createRouletteStore(config);
	const up = createRouletteStore(config);
	const down = createRouletteStore(config);

	const reels = [left, right, up, down];

	let rafId: number | null = null;
	let lastTime = 0;

	const startLoop = () => {
		if (typeof window === "undefined") return;
		if (rafId !== null) return;
		lastTime = 0;

		const loop = (time: number) => {
			if (!lastTime) lastTime = time;
			const delta = time - lastTime;
			lastTime = time;
			reels.forEach((reel) => reel.tick(delta));
			if (reels.some((reel) => reel.getState().phase === "spinning")) {
				rafId = requestAnimationFrame(loop);
			} else {
				stopLoop();
			}
		};

		rafId = requestAnimationFrame(loop);
	};

	const stopLoop = () => {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		lastTime = 0;
	};

	const spinAll = () => {
		reels.forEach((reel) => reel.spin());
		startLoop();
	};

	onDestroy(() => {
		stopLoop();
		reels.forEach((reel) => reel.engine.dispose());
	});

	const repeatSymbols = Array.from({ length: 8 }, () => symbols).flat();

	const offsetFor = (angle: number, direction: "left" | "right" | "up" | "down") => {
		const cycle = symbols.length * itemSize;
		const normalized = ((angle % 360) + 360) % 360;
		const offset = (normalized / 360) * cycle;
		const signed = direction === "left" || direction === "up" ? -offset : offset;
		const base = -cycle * 3;
		return base + signed;
	};
</script>

<div class="app">
	<header class="header">
		<h1>bull-roulette (Slots)</h1>
		<p>Slot-machine motion using the headless engine angle.</p>
	</header>

	<nav class="nav">
		<a href="/">Headless demo</a>
		<a href="/spin">Spinning demo</a>
	</nav>

	<div class="controls">
		<button type="button" on:click={spinAll}>Spin all</button>
	</div>

	<div class="slot-grid">
		<div class="slot">
			<div class="slot-label">Left</div>
			<div class="slot-window horizontal">
				<div
					class="slot-track"
					style={`transform: translateX(${offsetFor($left.angle, "left")}px);`}
				>
					{#each repeatSymbols as symbol, index (index)}
						<div class="slot-item">{symbol}</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="slot">
			<div class="slot-label">Right</div>
			<div class="slot-window horizontal">
				<div
					class="slot-track"
					style={`transform: translateX(${offsetFor($right.angle, "right")}px);`}
				>
					{#each repeatSymbols as symbol, index (index)}
						<div class="slot-item">{symbol}</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="slot">
			<div class="slot-label">Up</div>
			<div class="slot-window vertical">
				<div
					class="slot-track"
					style={`transform: translateY(${offsetFor($up.angle, "up")}px);`}
				>
					{#each repeatSymbols as symbol, index (index)}
						<div class="slot-item">{symbol}</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="slot">
			<div class="slot-label">Down</div>
			<div class="slot-window vertical">
				<div
					class="slot-track"
					style={`transform: translateY(${offsetFor($down.angle, "down")}px);`}
				>
					{#each repeatSymbols as symbol, index (index)}
						<div class="slot-item">{symbol}</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.app {
		max-width: 960px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
		color: #f2f2f2;
	}

	.header h1 {
		margin: 0 0 0.25rem;
		font-size: 2rem;
	}

	.header p {
		margin: 0;
		color: #c6c6c6;
	}

	.nav {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.nav a {
		color: #8ab4f8;
		font-weight: 600;
	}

	.controls {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.controls button {
		padding: 0.6rem 1rem;
		border-radius: 8px;
		border: 1px solid #ccc;
		background: #f5f5f5;
		color: #111;
		cursor: pointer;
		font-weight: 600;
	}

	.controls button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.slot-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
	}

	.slot {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 16px;
		background: #1f1f1f;
		border: 1px solid #333;
	}

	.slot-label {
		font-weight: 700;
		color: #f2f2f2;
	}

	.slot-window {
		position: relative;
		overflow: hidden;
		border-radius: 12px;
		border: 2px solid #3a3a3a;
		background: #111;
	}

	.slot-window.horizontal {
		height: 90px;
	}

	.slot-window.vertical {
		width: 90px;
		height: 220px;
	}

	.slot-track {
		display: flex;
	}

	.slot-window.vertical .slot-track {
		flex-direction: column;
	}

	.slot-item {
		width: 72px;
		height: 72px;
		display: grid;
		place-items: center;
		font-size: 2rem;
		color: #f7f7f7;
	}

	.slot-window.horizontal .slot-item {
		width: 72px;
	}

	.slot-window.vertical .slot-item {
		height: 72px;
	}
</style>
