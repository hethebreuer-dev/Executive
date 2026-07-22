// Node/Next runtime context. Kept separate from ./context (which the Worker
// imports) so Node globals never leak into the Worker bundle/typecheck.

import type { ConnectorContext } from "./context";

export function nodeContext(): ConnectorContext {
  return {
    env: (key) => process.env[key],
    base64: (input) => Buffer.from(input).toString("base64"),
  };
}
