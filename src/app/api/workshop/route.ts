// Workshop AI — streaming air-cooled 911 Q&A via the Anthropic SDK (Claude Sonnet).
// Server-side so ANTHROPIC_API_KEY never reaches the browser. The UI gates this
// behind sign-in; note that the client-side auth prototype can't truly secure a
// public endpoint — real auth + rate limiting is a production follow-up.

import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

type Msg = { role: "user" | "assistant"; content: string };

function systemPrompt(chassis: string): string {
  return `You are the LUFT Workshop assistant — an expert air-cooled Porsche mechanic and marque specialist. LUFT is a marketplace and workshop for air-cooled 911s (and the 912, 930, 964, and 993).

The person is working on a ${chassis}. Give practical, accurate, hands-on help: diagnose from symptoms, walk through service procedures, give torque figures and clearances, call out common failure points, and offer buying/ownership advice — all specific to air-cooled Porsches.

Guidelines:
- Stay on air-cooled Porsches, and lean toward the ${chassis} where it's relevant. If asked about a different car or something off-topic, answer briefly and steer back.
- Give concrete specs (torque, clearances, part numbers, intervals) when you're confident. For safety-critical work — brakes, fuel, suspension, engine internals — tell them to confirm against a factory manual or a specialist.
- Be concise and direct: a few tight paragraphs or a short list, no preamble.
- You are not affiliated with Dr. Ing. h.c. F. Porsche AG; never imply otherwise.`;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("The Workshop AI isn't configured yet.", { status: 503 });
  }

  let body: { messages?: unknown; chassis?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const chassis =
    typeof body.chassis === "string" && body.chassis.trim()
      ? body.chassis.trim().slice(0, 80)
      : "air-cooled Porsche 911";

  const raw: Msg[] = Array.isArray(body.messages) ? (body.messages as Msg[]) : [];
  const messages = raw
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim()
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return new Response("Bad request", { status: 400 });
  }

  const client = new Anthropic({ apiKey });
  const stream = client.messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    thinking: { type: "disabled" }, // snappy chat, no tools involved
    system: systemPrompt(chassis),
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        console.error("workshop stream failed:", err);
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
