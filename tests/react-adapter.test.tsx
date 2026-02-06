import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { useRoulette } from "../src/react";

const config = {
  segments: [{ id: "a" }, { id: "b" }],
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
});
