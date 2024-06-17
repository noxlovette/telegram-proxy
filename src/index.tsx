import Bun from "bun";
import { TelegramClient, sessions } from 'telegram';
import { StringSession } from 'telegram/sessions';

const SESSION = new StringSession('');
const API_ID: number = parseInt(process.env.APP_ID || '', 10);
const API_HASH: string = process.env.APP_HASH || '';

const client = new TelegramClient(SESSION, API_ID, API_HASH, {connectionRetries: 5})

const server = Bun.serve({
  async fetch(req) {
    const path = new URL(req.url).pathname;

   if (path === "/send-code" && req.method === "POST") {
    console.log("Sending code");
    const {phoneNumber} = await req.json();

try {
await client.connect();
await client.sendCode({apiId: API_ID, apiHash: API_HASH}, phoneNumber);

return new Response(JSON.stringify({ message: "Code Sent" }), {
  headers: { "Content-Type": "application/json" },
});

} catch (error) {
  console.error("Error sending code: ", error);
  return new Response("Error", {status: 500});
}
}
if (path ==="/start-client" && req.method === "POST") {
  const {phoneNumber, phoneCode, password} = await req.json();

  try {
    await client.start({
      phoneNumber: async () => phoneNumber,
      password: async () => password || undefined,
      phoneCode: async () => phoneCode, 
      onError: () => {}
    });
    const savedSession = client.session.save();
    client.disconnect();

    return new Response(JSON.stringify({message: "Logged in!", savedSession: savedSession}), {
  headers: {"Content-Type": "application/json"},
});
  } catch (error) {
    if (error.message === "PHONE_PASSWORD_PROTECTED") {
      return new Response(JSON.stringify({message: "Password required"}), {
        headers: {"Content-Type": "application/json"},
      });
    }
    console.log("Error starting client: ", error);
    return new Response("Error", {status: error.status || 500});
  }
}

if (path === "/password-protected" && req.method === "POST") {
  const {phoneNumber, password, phoneCode} = await req.json();
  try {
    await client.start({
      phoneNumber: async () => phoneNumber,
      password: async () => password,
      phoneCode: async () => phoneCode,
      onError: () => {}
    });
    const savedSession = client.session.save();
    client.disconnect();

    return new Response(JSON.stringify({message: "Logged in!", savedSession: savedSession}), {
      headers: {"Content-Type": "application/json"},
    });
  } catch (error) {
    console.log("Error starting client: ", error);
    return new Response("Error", {status: error.status || 500});
  }
}

    if (path === "/") {
      return new Response("Welcome to Bun!");
    }

    if (path === "/disconnect") {
      client.disconnect();
      return new Response("Disconnected");
    }

    return new Response("Page not found", { status: 404 });
  },
});

console.log(`Listening on ${server.url}`);
