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
  const {phoneNumber, phoneCode} = await req.json();

  try {
    await client.start({
      phoneNumber,
      phoneCode: async () => phoneCode, 
      onError: (err) => console.log("Error logging in: ", err)
    });
    await client.sendMessage('me', {message: "WE ARE IN"});

    const savedSession = client.session.save();
    client.disconnect();

  return new Response(JSON.stringify(savedSession), {
  headers: {"Content-Type": "application/json"},
});
  } catch (error) {
    console.log("Error starting client: ", error);
    return new Response("Error", {status: 500});
  }
}


    if (path === "/send-message" && req.method === "POST") {
      console.log("Sending message");
      const { message, sessionString, userId } = await req.json();
      console.log("Message: ", message);  
      console.log("Session: ", sessionString);
      try {
        const newSESSION = new StringSession(sessionString);
        const savedClient = new TelegramClient(newSESSION, API_ID, API_HASH, {connectionRetries: 5})
        await savedClient.connect();
        
        await savedClient.sendMessage(`${userId}`, {message});
        return new Response(JSON.stringify({ message: "Message sent" }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error sending message: ", error);
        return new Response("Error", { status: 500 });
      }
    }

    // Respond with other routes
    if (path === "/") {
      return new Response("Welcome to Bun!");
    }

    if (path === "/disconnect") {
      client.disconnect();
      return new Response("Disconnected");
    }

    // Handle other routes or return 404
    return new Response("Page not found", { status: 404 });
  },
});

console.log(`Listening on ${server.url}`);
