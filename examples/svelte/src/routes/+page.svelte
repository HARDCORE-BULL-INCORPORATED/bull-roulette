<script lang="ts">
	import { onDestroy } from "svelte";
	import { createRouletteStore } from "bull-roulette/svelte";

	const segments = [
		{ id: "alpha", label: "Alpha", weight: 1 },
		{ id: "bravo", label: "Bravo", weight: 2 },
		{ id: "charlie", label: "Charlie", weight: 3 },
		{ id: "delta", label: "Delta", weight: 1 },
		{ id: "echo", label: "Echo", weight: 2 },
	];

	const roulette = createRouletteStore({
		segments,
		durationMs: 2500,
		minRotations: 3,
		maxRotations: 5,
		jitterFactor: 0.25,
	});

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
			roulette.tick(delta);
			rafId = requestAnimationFrame(loop);
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

	const spin = () => {
		roulette.spin();
		startLoop();
	};

	const spinTo = (index: number) => {
		roulette.spin({ targetIndex: index });
		startLoop();
	};

	const unsubscribe = roulette.subscribe((state) => {
		if (state.phase === "stopped") stopLoop();
	});

	onDestroy(() => {
		stopLoop();
		unsubscribe();
	});
</script>

<div class="app">
	<header class="header">
		<h1>bull-roulette (Svelte)</h1>
		<p>Headless engine demo using the Svelte adapter.</p>
	</header>

	<nav class="nav">
		<a href="/spin">Spinning demo</a>
		<a href="/slots">Slot machine demo</a>
	</nav>

	<div class="controls">
		<button type="button" on:click={spin} disabled={$roulette.phase === "spinning"}>
			Spin
		</button>
		<button type="button" on:click={() => spinTo(1)} disabled={$roulette.phase === "spinning"}>
			Spin to index 1
		</button>
	</div>

	<section class="status">
		<div>Phase: {$roulette.phase}</div>
		<div>Angle: {$roulette.angle.toFixed(2)}°</div>
		<div>
			Winner:
			{#if $roulette.phase === "stopped" && $roulette.winningIndex !== null}
				{segments[$roulette.winningIndex].label}
			{:else}
				—
			{/if}
		</div>
	</section>

	<ul class="segments">
		{#each segments as segment, index}
			<li class:winner={$roulette.phase === "stopped" && index === $roulette.winningIndex}>
				<span>{segment.label}</span>
				<span class="weight">weight {segment.weight}</span>
			</li>
		{/each}
	</ul>
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

	.status {
		display: grid;
		gap: 0.25rem;
		padding: 1rem;
		background: #2b2b2b;
		border-radius: 10px;
		color: #f2f2f2;
	}

	.segments {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.75rem;
	}

	.segments li {
		padding: 0.75rem 1rem;
		border-radius: 10px;
		border: 1px solid #e0e0e0;
		display: flex;
		justify-content: space-between;
		background: #222;
	}

	.segments li.winner {
		border-color: #111;
		background: #ffe9c5;
		color: #111;
	}

	.weight {
		color: #666;
		font-size: 0.9rem;
	}
</style>
