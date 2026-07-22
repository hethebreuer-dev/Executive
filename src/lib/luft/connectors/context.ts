// Runtime context handed to every connector so the same connector code runs in
// Node (Next server) and in a Cloudflare Worker. Connectors never touch
// process.env / Buffer directly — they read config through here.
//
// The Node context lives in ./context-node so this module (imported by the
// Worker) stays free of Node globals.

export interface ConnectorContext {
  /** Read an env var / binding by name. */
  env: (key: string) => string | undefined;
  /** base64-encode (btoa in Workers, Buffer in Node — see context-node). */
  base64: (input: string) => string;
}

/**
 * Context for a Cloudflare Worker. Pass the Worker's `env` binding object; its
 * string values become connector config. (btoa is global in Workers.)
 */
export function workerContext(env: Record<string, unknown>): ConnectorContext {
  return {
    env: (key) => {
      const v = env[key];
      return typeof v === "string" ? v : undefined;
    },
    base64: (input) => btoa(input),
  };
}
