import { NextRequest } from "next/server";
import Anthropic        from "@anthropic-ai/sdk";
import { getServerSession } from "next-auth";
import { authOptions }  from "@/lib/auth";
import "@/lib/env"; // BUG-003: validate required env vars at startup
import { SYSTEM_PROMPT, REWRITE_PROMPT } from "@/lib/ai/system-prompt";
import { AiError }      from "@/lib/ai/errors";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// ─── Configuration ─────────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

export const runtime    = "nodejs";
export const maxDuration = 60;

/**
 * How long (ms) we wait for the Anthropic stream before aborting.
 * Slightly shorter than maxDuration so the route can still send the error
 * chunk before Vercel/Next kills the connection.
 */
const STREAM_TIMEOUT_MS = 45_000;

// ─── SSE helpers ──────────────────────────────────────────────────────────────

const encoder = new TextEncoder();

function sseChunk(payload: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {

  // ── Auth ───────────────────────────────────────────────────────────────────

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(
      JSON.stringify({ error: "Necessitas de iniciar sessão para usar o assistente." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Rate limit: 20 requests / min per user ─────────────────────────────────
  const userId = (session.user as { id: string }).id;
  const rl = rateLimit("ai-chat", userId, { limit: 20, windowMs: 60 * 1000 });
  if (!rl.allowed) {
    logger.warn("ai/chat", "AI_RATE_LIMIT_EXCEEDED", { userId });
    return tooManyRequests(rl);
  }

  // ── Parse body ─────────────────────────────────────────────────────────────

  let body: { messages?: unknown; mode?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Pedido inválido — corpo JSON em falta." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages, mode } = body as {
    messages: { role: "user" | "assistant"; content: string }[];
    mode?: "chat" | "rewrite" | "analyze";
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Mensagem em falta." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Basic message shape validation — prevent prompt injection via malformed roles
  for (const m of messages) {
    if (!["user", "assistant"].includes(m.role) || typeof m.content !== "string") {
      return new Response(
        JSON.stringify({ error: "Formato de mensagem inválido." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // ── System prompt selection ────────────────────────────────────────────────

  const systemPrompt =
    mode === "rewrite"
      ? `${SYSTEM_PROMPT}\n\n${REWRITE_PROMPT}`
      : SYSTEM_PROMPT;

  // ── Streaming response ─────────────────────────────────────────────────────

  const controller = new AbortController();
  // Server-side hard deadline — prevents runaway streams
  const deadline = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

  const readable = new ReadableStream({
    async start(streamCtrl) {
      try {
        const stream = anthropic.messages.stream(
          {
            model:      "claude-sonnet-4-6",
            max_tokens: 1500,
            system:     systemPrompt,
            messages:   messages.map((m) => ({ role: m.role, content: m.content })),
          },
          // Pass AbortSignal so the SDK cancels in-flight HTTP cleanly
          { signal: controller.signal },
        );

        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            streamCtrl.enqueue(sseChunk({ text: chunk.delta.text }));
          }
        }

        streamCtrl.enqueue(encoder.encode("data: [DONE]\n\n"));
        streamCtrl.close();

      } catch (err) {
        const aiErr = AiError.fromUnknown(err);

        // Log at warn level: AI errors are expected and handled
        logger.warn("ai/chat", "AI_STREAM_ERROR", { detail: `${aiErr.kind}: ${aiErr.message}`, userId });

        // Emit a structured error chunk so the client can display the right message
        streamCtrl.enqueue(
          sseChunk({
            error:     aiErr.chatMessage,   // pt-PT, safe for display
            kind:      aiErr.kind,          // for client-side classification
            retryable: aiErr.retryable,
          })
        );
        streamCtrl.close();

      } finally {
        clearTimeout(deadline);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  });
}
