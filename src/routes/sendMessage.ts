import { sendMessage } from "../services/telegramService";

export async function sendMessageRoute(req: Request) {
  const { token, chatId, text } = await req.json();
  const response = await sendMessage(token, chatId, text);
  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
}
