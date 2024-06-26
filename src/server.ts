// src/server.ts

import express, { Request, Response } from 'express';
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { PhoneMigrateError } from "telegram/errors"; // Import the specific error'
import dotenv from 'dotenv';
dotenv.config();


const SESSION = new StringSession("");
const API_ID = parseInt(process.env.API_ID || "", 10);
const API_HASH = process.env.API_HASH || "";

const client = new TelegramClient(SESSION, API_ID, API_HASH, {
  connectionRetries: 5,
});

const app = express();
const port = 3000;

app.use(express.json());

app.post('/send-code', async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  while (true) {
    try {
      await client.connect();
      await client.sendCode(
        { apiId: API_ID, apiHash: API_HASH },
        phoneNumber
      );

      res.json({ message: "Code Sent" });
      return;
    } catch (error) {
      if (error instanceof PhoneMigrateError) {
        console.warn("PhoneMigrateError caught, migrating to DC: ", error);
        continue;
      }
      console.error("Error sending code: ", error);
      res.status(500).json({ error: "Error sending code" });
      return;
    }
  }
});

app.post('/start-client', async (req: Request, res: Response) => {
  const { phoneNumber, phoneCode, password } = req.body;

  while (true) {
    try {
      await client.start({
        phoneNumber: async () => phoneNumber,
        password: async () => password || "",
        phoneCode: async () => phoneCode,
        onError: (err) => {
          throw err;
        },
      });

      const savedSession = client.session.save();

      await client.disconnect();

      res.json({
        message: "Logged in!",
        savedSession: savedSession
      });
      return;
    } catch (error) {
      if (error instanceof PhoneMigrateError) {
        console.warn("PhoneMigrateError caught, migrating to DC: ", error);
        await client.connect();
        continue;
      }
    
      console.error("Error starting client: ", error);
      res.status(500).json({
        error: "Failed to start client",
      });
      return;
    }
  }
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Page not found" });
});

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`);
});
