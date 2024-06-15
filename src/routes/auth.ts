import { authenticateUser } from "../services/telegramService";

export async function authRoute(req: Request) {
    const { phoneNumber, code } = await req.json();
    const sessionToken = await authenticateUser(phoneNumber, code);
    return new Response(JSON.stringify({ sessionToken }), {
      headers: { "Content-Type": "application/json" },
    });
  }