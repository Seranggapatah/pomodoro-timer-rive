import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ─── Patch WebGL2 context creation ──────────────────────────────────────────
// Rive WebGL2 renderer reads pixels during ASCII conversion.
// By default WebGL2 clears the drawing buffer after each frame ("swap"),
// making readPixels return zeros. We intercept getContext globally here —
// before any canvas is created — and force preserveDrawingBuffer: true so the
// last rendered frame stays readable until the next draw call.
const _origGetContext = HTMLCanvasElement.prototype.getContext;
// @ts-ignore — we intentionally widen the signature
HTMLCanvasElement.prototype.getContext = function (
  type: string,
  attrs?: Record<string, unknown>,
) {
  if (type === "webgl2" || type === "webgl") {
    attrs = { ...(attrs ?? {}), preserveDrawingBuffer: true };
  }
  // @ts-ignore
  return _origGetContext.call(this, type, attrs);
};
// ────────────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
