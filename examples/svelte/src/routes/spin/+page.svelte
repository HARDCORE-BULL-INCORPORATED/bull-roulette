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

	const wheelColors = ["#f94144", "#f3722c", "#f8961e", "#90be6d", "#577590"];

	const roulette = createRouletteStore({
		segments,
		durationMs: 2500,
		minRotations: 3,
		maxRotations: 5,
		jitterFactor: 0.15,
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

	$: slice = 360 / segments.length;
	$: gradientStops = segments
		.map((_, index) => {
			const start = index * slice;
			const end = (index + 1) * slice;
			const color = wheelColors[index % wheelColors.length];
			return `${color} ${start}deg ${end}deg`;
		})
		.join(", ");
</script>

<div class="app">
	<header class="header">
		<h1>bull-roulette (Spin)</h1>
		<p>Simple spinning animation driven by the headless engine.</p>
	</header>

	<nav class="nav">
		<a href="/">Back to headless demo</a>
	</nav>

	<div class="wheel-wrap">
		<div class="pointer"></div>
		<div
			class="wheel"
			style={`transform: rotate(${$roulette.angle}deg); background-image: conic-gradient(${gradientStops});`}
		></div>
	</div>

	<div class="controls">
		<button type="button" on:click={spin} disabled={$roulette.phase === "spinning"}>
			Spin
		</button>
		<button type="button" on:click={() => spinTo(2)} disabled={$roulette.phase === "spinning"}>
			Spin to index 2
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
	}

	.header h1 {
		margin: 0 0 0.25rem;
		font-size: 2rem;
	}

	.header p {
		margin: 0;
		color: #555;
	}

	.nav a {
		color: #1f6feb;
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
		background: #fff;
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
		background: #f7f7f7;
		border-radius: 10px;
	}

	.wheel-wrap {
		position: relative;
		width: 320px;
		height: 320px;
		margin: 0 auto;
	}

	.wheel {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		border: 6px solid #111;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
		transition: transform 0.05s linear;
	}

	.pointer {
		position: absolute;
		top: -6px;
		left: 50%;
		width: 0;
		height: 0;
		border-left: 12px solid transparent;
		border-right: 12px solid transparent;
		border-bottom: 22px solid #111;
		transform: translateX(-50%);
		z-index: 2;
	}
</style>
