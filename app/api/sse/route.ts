import { type NextRequest } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { addSseClient, removeSseClient } from "@/lib/sse/sse-manager";

export const dynamic = "force-dynamic";
// Ensure Node.js runtime — Edge runtime lacks the persistent process needed for SSE
export const runtime = "nodejs";

const PING_INTERVAL_MS = 25_000;
const encoder = new TextEncoder();

function encode(chunk: string) {
  return encoder.encode(chunk);
}

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session?.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.userId;
  let pingTimer: NodeJS.Timeout;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      addSseClient(userId, controller);

      // Confirm connection to the client
      controller.enqueue(encode("event: connected\ndata: {}\n\n"));

      // Send a comment-ping every 25 s so proxies don't close idle connections
      pingTimer = setInterval(() => {
        try {
          controller.enqueue(encode(": ping\n\n"));
        } catch {
          clearInterval(pingTimer);
          removeSseClient(userId, controller);
        }
      }, PING_INTERVAL_MS);

      // Cleanup when the client disconnects (AbortSignal fires before `cancel`)
      request.signal.addEventListener("abort", () => {
        clearInterval(pingTimer);
        removeSseClient(userId, controller);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },

    cancel() {
      clearInterval(pingTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, no-transform",
      Connection: "keep-alive",
      // Tell Nginx/proxies not to buffer the stream
      "X-Accel-Buffering": "no",
    },
  });
}
