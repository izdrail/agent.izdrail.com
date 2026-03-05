import { Message } from "../messages/messages";

const OLLAMA_API = "https://ai.izdrail.com/api/chat";

export async function getChatResponse(messages: Message[]) {
  const res = await fetch(OLLAMA_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma3:270m",
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama API Error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const message = data.message?.content || "An error has occurred";

  return { message };
}

export async function getChatResponseStream(messages: Message[]) {
  const res = await fetch(OLLAMA_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma3:270m",
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Failed to connect to Ollama stream: ${res.status}`);
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

          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const json = JSON.parse(line);
              const content = json.message?.content;

              // Only enqueue if there's actual content
              if (content) {
                controller.enqueue(content);
              }

              // Check if this is the final chunk
              if (json.done) {
                controller.close();
                reader.releaseLock();
                return;
              }
            } catch (parseError) {
              console.error("Failed to parse JSON line:", line, parseError);
            }
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        try {
          controller.close();
        } catch {
          // Stream already closed
        }
        reader.releaseLock();
      }
    },
  });

  return stream;
}