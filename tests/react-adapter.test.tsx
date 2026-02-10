import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { useRoulette } from "../src/react";
import type { UseRouletteResult } from "../src/react";

const config = {
  segments: [{ id: "a" }, { id: "b" }, { id: "c" }],
  durationMs: 200,
  minRotations: 1,
  maxRotations: 1,
  jitterFactor: 0,
};

describe("react adapter", () => {
  it("renders without throwing", () => {
    const App = () => {
      const { state } = useRoulette(config);
      return React.createElement("div", null, state.phase);
    };

    expect(() => renderToString(React.createElement(App))).not.toThrow();
  });

  it("initial state phase is idle", () => {
    let capturedPhase = "" as string;
    const App = () => {
      const { state } = useRoulette(config);
      capturedPhase = state.phase;
      return React.createElement("div", null, state.phase);
    };

    renderToString(React.createElement(App));
    expect(capturedPhase).toBe("idle");
  });

  it("initial state angle is 0", () => {
    let capturedAngle = -1 as number;
    const App = () => {
      const { state } = useRoulette(config);
      capturedAngle = state.angle;
      return React.createElement("div", null, String(state.angle));
    };

    renderToString(React.createElement(App));
    expect(capturedAngle).toBe(0);
  });

  it("exposes spin, tick, stopAt, spinAsync, getState, getWinningSegment", () => {
    let result: UseRouletteResult<unknown> | undefined;
    const App = () => {
      const roulette = useRoulette(config);
      result = roulette;
      return React.createElement("div", null, "ok");
    };

    renderToString(React.createElement(App));
    expect(result).toBeDefined();
    expect(typeof result!.spin).toBe("function");
    expect(typeof result!.tick).toBe("function");
    expect(typeof result!.stopAt).toBe("function");
    expect(typeof result!.spinAsync).toBe("function");
    expect(typeof result!.getState).toBe("function");
    expect(typeof result!.getWinningSegment).toBe("function");
  });

  it("exposes the engine instance", () => {
    let hasEngine = false;
    const App = () => {
      const { engine } = useRoulette(config);
      hasEngine = engine !== null && engine !== undefined;
      return React.createElement("div", null, "ok");
    };

    renderToString(React.createElement(App));
    expect(hasEngine).toBe(true);
  });

  it("state contains segments from config", () => {
    let segmentCount = 0;
    const App = () => {
      const { state } = useRoulette(config);
      segmentCount = state.segments.length;
      return React.createElement("div", null, String(segmentCount));
    };

    renderToString(React.createElement(App));
    expect(segmentCount).toBe(3);
  });

  it("state has null winningIndex initially", () => {
    let winningIndex: number | null = -999;
    const App = () => {
      const { state } = useRoulette(config);
      winningIndex = state.winningIndex;
      return React.createElement("div", null, "ok");
    };

    renderToString(React.createElement(App));
    expect(winningIndex).toBeNull();
  });

  it("handles custom startAngle config", () => {
    let capturedAngle = -1 as number;
    const App = () => {
      const { state } = useRoulette({ ...config, startAngle: 45 });
      capturedAngle = state.angle;
      return React.createElement("div", null, String(state.angle));
    };

    renderToString(React.createElement(App));
    expect(capturedAngle).toBe(45);
  });
});
