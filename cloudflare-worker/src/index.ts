export interface Env {
    AI: any;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (request.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        try {
            const { messages } = await request.json() as any;

            // Use Cloudflare Workers AI with Gemma 7B IT
            const response = await env.AI.run("@cf/google/gemma-7b-it", {
                messages,
                stream: true,
            });

            return new Response(response, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }
    },
};
