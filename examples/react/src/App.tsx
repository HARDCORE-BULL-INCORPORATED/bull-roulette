import { useEffect, useMemo, useRef } from "react";
import { useRoulette } from "bull-roulette/react";
import "./App.css";

function App() {
    const segments = useMemo(
        () => [
            { id: "alpha", label: "Alpha", weight: 1 },
            { id: "bravo", label: "Bravo", weight: 2 },
            { id: "charlie", label: "Charlie", weight: 3 },
            { id: "delta", label: "Delta", weight: 1 },
            { id: "echo", label: "Echo", weight: 2 },
        ],
        [],
    );

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

    const rafIdRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (state.phase !== "spinning") {
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
    }, [state.phase, tick]);

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
}

export default App;
