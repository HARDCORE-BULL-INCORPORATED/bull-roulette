import { useEffect, useMemo, useRef } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { useRoulette } from "bull-roulette/react";
import "./App.css";

const SEGMENTS = [
	{ id: "alpha", label: "Alpha", weight: 1 },
	{ id: "bravo", label: "Bravo", weight: 2 },
	{ id: "charlie", label: "Charlie", weight: 3 },
	{ id: "delta", label: "Delta", weight: 1 },
	{ id: "echo", label: "Echo", weight: 2 },
];

const WHEEL_COLORS = ["#f94144", "#f3722c", "#f8961e", "#90be6d", "#577590"];

const useSpinLoop = (phase: string, tick: (delta: number) => void) => {
	const rafIdRef = useRef<number | null>(null);
	const lastTimeRef = useRef<number | null>(null);

	useEffect(() => {
		if (phase !== "spinning") {
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current);
				rafIdRef.current = null;
			}
			lastTimeRef.current = null;
			return;
		}

		const loop = (time: number) => {
			if (lastTimeRef.current === null) {
				lastTimeRef.current = time;
			}
			const delta = time - lastTimeRef.current;
			lastTimeRef.current = time;
			tick(delta);
			rafIdRef.current = requestAnimationFrame(loop);
		};

		rafIdRef.current = requestAnimationFrame(loop);

		return () => {
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current);
				rafIdRef.current = null;
			}
			lastTimeRef.current = null;
		};
	}, [phase, tick]);
};

const HeadlessDemo = () => {
	const segments = useMemo(() => SEGMENTS, []);
	const config = useMemo(
		() => ({
			segments,
			durationMs: 2500,
			minRotations: 3,
			maxRotations: 5,
			jitterFactor: 0.25,
		}),
		[segments],
	);

	const { state, spin, tick } = useRoulette(config);
	useSpinLoop(state.phase, tick);

	const winner =
		state.phase === "stopped" && state.winningIndex !== null
			? segments[state.winningIndex]
			: null;

	return (
		<div className="app">
			<header className="header">
				<h1>bull-roulette (React)</h1>
				<p>Headless engine demo using the React adapter.</p>
			</header>

			<nav className="nav">
				<Link to="/spin">Go to spinning demo</Link>
			</nav>

			<div className="controls">
				<button type="button" onClick={() => spin()} disabled={state.phase === "spinning"}>
					Spin
				</button>
				<button
					type="button"
					onClick={() => spin({ targetIndex: 1 })}
					disabled={state.phase === "spinning"}
				>
					Spin to index 1
				</button>
			</div>

			<section className="status">
				<div>Phase: {state.phase}</div>
				<div>Angle: {state.angle.toFixed(2)}°</div>
				<div>Winner: {winner ? `${winner.label ?? winner.id}` : "—"}</div>
			</section>

			<ul className="segments">
				{segments.map((segment, index) => (
					<li
						key={segment.id}
						className={
							state.phase === "stopped" && index === state.winningIndex
								? "segment winner"
								: "segment"
						}
					>
						<span>{segment.label ?? segment.id}</span>
						<span className="weight">weight {segment.weight ?? 1}</span>
					</li>
				))}
			</ul>
		</div>
	);
};

const SpinDemo = () => {
	const segments = useMemo(() => SEGMENTS, []);
	const config = useMemo(
		() => ({
			segments,
			durationMs: 2500,
			minRotations: 3,
			maxRotations: 5,
			jitterFactor: 0.15,
		}),
		[segments],
	);

	const { state, spin, tick } = useRoulette(config);
	useSpinLoop(state.phase, tick);

	const gradientStops = segments
		.map((_, index) => {
			const slice = 360 / segments.length;
			const start = index * slice;
			const end = (index + 1) * slice;
			const color = WHEEL_COLORS[index % WHEEL_COLORS.length];
			return `${color} ${start}deg ${end}deg`;
		})
		.join(", ");

	const winner =
		state.phase === "stopped" && state.winningIndex !== null
			? segments[state.winningIndex]
			: null;

	return (
		<div className="app">
			<header className="header">
				<h1>bull-roulette (Spin)</h1>
				<p>Simple spinning animation driven by the headless engine.</p>
			</header>

			<nav className="nav">
				<Link to="/">Back to headless demo</Link>
			</nav>

			<div className="wheel-wrap">
				<div className="pointer" />
				<div
					className="wheel"
					style={{
						transform: `rotate(${state.angle}deg)`,
						backgroundImage: `conic-gradient(${gradientStops})`,
					}}
				/>
			</div>

			<div className="controls">
				<button type="button" onClick={() => spin()} disabled={state.phase === "spinning"}>
					Spin
				</button>
				<button
					type="button"
					onClick={() => spin({ targetIndex: 2 })}
					disabled={state.phase === "spinning"}
				>
					Spin to index 2
				</button>
			</div>

			<section className="status">
				<div>Phase: {state.phase}</div>
				<div>Angle: {state.angle.toFixed(2)}°</div>
				<div>Winner: {winner ? `${winner.label ?? winner.id}` : "—"}</div>
			</section>
		</div>
	);
};

function App() {
	return (
		<Routes>
			<Route path="/" element={<HeadlessDemo />} />
			<Route path="/spin" element={<SpinDemo />} />
		</Routes>
	);
}

export default App;
