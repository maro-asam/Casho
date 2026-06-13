type SseController = ReadableStreamDefaultController<Uint8Array>;

// Use a global to survive Next.js hot-module-reload in development.
// In production the module singleton is stable anyway.
const g = global as typeof global & {
  _sseClients?: Map<string, Set<SseController>>;
};

const clients: Map<string, Set<SseController>> =
  g._sseClients ?? new Map();

if (process.env.NODE_ENV !== "production") {
  g._sseClients = clients;
}

export function addSseClient(userId: string, controller: SseController) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId)!.add(controller);
}

export function removeSseClient(userId: string, controller: SseController) {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(controller);
  if (set.size === 0) clients.delete(userId);
}

export function broadcastToUser(userId: string, eventType: string, data: unknown) {
  const set = clients.get(userId);
  if (!set || set.size === 0) return;

  const encoder = new TextEncoder();
  const message = encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);

  for (const ctrl of set) {
    try {
      ctrl.enqueue(message);
    } catch {
      // Controller is closed; the disconnect handler will remove it
      set.delete(ctrl);
    }
  }
}
