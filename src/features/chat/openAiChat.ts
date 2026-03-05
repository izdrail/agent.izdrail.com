import { Message } from "../messages/messages";

const CLOUDFLARE_WORKER_URL = "https://rainwater-ai-worker.stefan.workers.dev"; // Placeholder - update with your actual worker URL

export async function getChatResponse(messages: Message[]) {
  const res = await fetch(CLOUDFLARE_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    throw new Error(`Cloudflare AI Error: ${res.status}`);
  }

  const data = await res.json() as any;
  return { message: data.response || "An error has occurred" };
}

export async function getChatResponseStream(messages: Message[]) {
  const res = await fetch(CLOUDFLARE_WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Failed to connect to Cloudflare AI stream: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

            const jsonStr = trimmedLine.replace("data: ", "");
            if (jsonStr === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const json = JSON.parse(jsonStr);
              const content = json.response;

              if (content) {
                controller.enqueue(content);
              }
            } catch (e) {
              console.error("Error parsing Cloudflare stream chunk:", e);
            }
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        try { controller.close(); } catch { }
        reader.releaseLock();
      }
    },
  });

  return stream;
}