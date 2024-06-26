import Bun from "bun";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { PhoneMigrateError } from "telegram/errors"; // Import the specific error

const SESSION = new StringSession("");
const API_ID = parseInt(process.env.APP_ID || "", 10);
const API_HASH = process.env.APP_HASH || "";

const client = new TelegramClient(SESSION, API_ID, API_HASH, {
  connectionRetries: 5,
});

const server = Bun.serve({
  async fetch(req) {
    const path = new URL(req.url).pathname;

    if (path === "/send-code" && req.method === "POST") {
      console.log("Sending code");
      const { phoneNumber } = await req.json();

      while (true) {
        try {
          await client.connect();
          await client.sendCode(
            { apiId: API_ID, apiHash: API_HASH },
            phoneNumber
          );

          return new Response(JSON.stringify({ message: "Code Sent" }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          if (error instanceof PhoneMigrateError) {
            console.warn("PhoneMigrateError caught, migrating to DC: ", error.dcId);
            // Update client DC and retry
            await client.setDC(error.dcId);
            // Retry sending the code
            continue;
          }
          if (error.message.includes('Timeout')) {
            console.warn("TimeoutError caught: ", error);
            // Retry sending the code after timeout
            continue;
          }
          console.error("Error sending code: ", error);
          return new Response("Error", { status: 500 });
        }
      }
    }

    if (path === "/start-client" && req.method === "POST") {
      const { phoneNumber, phoneCode, password } = await req.json();

      while (true) {
        try {
          await client.start({
            phoneNumber: async () => phoneNumber,
            password: async () => password || undefined,
            phoneCode: async () => phoneCode,
            onError: (err) => {
              throw err; // Throw the error to trigger the catch block
            },
          });

          const savedSession = client.session.save();

          await client.disconnect();

          return new Response(
            JSON.stringify({ message: "Logged in!", savedSession: savedSession }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (error) {
          if (error instanceof PhoneMigrateError) {
            console.warn("PhoneMigrateError caught, migrating to DC: ", error);
            await client.connect();
            continue;
          }
        
          console.error("Error starting client: ", error);
          return new Response(
            JSON.stringify({ error: "Failed to start client", message: error.message }),
            {
              status: error.status || 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    return new Response("Page not found", { status: 404 });
  },
});

console.log(`Listening on ${server.url}`);
