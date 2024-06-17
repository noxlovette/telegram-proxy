import TelegramBot from "node-telegram-bot-api";
import { TelegramClient, sessions } from 'telegram';
import { StringSession } from 'telegram/sessions';
import got from "got";

const token = process.env.BOT_API || "";
const bot = new TelegramBot(token, {polling: true});
const SESSION = new StringSession('');
const API_ID: number = parseInt(process.env.APP_ID || '', 10);
const API_HASH: string = process.env.APP_HASH || '';

const client = new TelegramClient(SESSION, API_ID, API_HASH, {connectionRetries: 5})


interface UserState {
    state: 'awaiting_phone' | 'awaiting_code' | 'awaiting_password';
    phoneNumber?: string;
    phoneCode?: string;
  }
  
  const userStates: Record<number, UserState> = {};
  
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userStates[chatId] = { state: 'awaiting_phone' };
    bot.sendMessage(chatId, "Please enter your phone number:");
  });
  
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';
  
    const userState = userStates[chatId];
  
    if (userState && userState.state === 'awaiting_phone') {
      try {

        await client.connect();
        await client.sendCode({apiId: API_ID, apiHash: API_HASH}, text);
  
        bot.sendMessage(chatId, "Please enter the code you received:");
        userStates[chatId] = { state: 'awaiting_code', phoneNumber: text };
      } catch (error) {
        bot.sendMessage(chatId, "Failed to send code. Please try again.");
        console.error("Error sending code:", error);
      }
    } else if (userState && userState.state === 'awaiting_code') {
      const phoneNumber = userState.phoneNumber || '';
      const phoneCode = text;
    
    try {
    
    await client.start({
      phoneNumber: async () => phoneNumber,
      phoneCode: async () => phoneCode, 
      onError: (err) => console.log("Error logging in: ", err),
    });
    const savedSession = client.session.save();
    client.disconnect();
    bot.sendMessage(chatId, `Successfully logged in! Here is your session string. DO NOT SHARE IT WITH ANYONE: ${savedSession}`);
    delete userStates[chatId];
    
    } catch (error) {
    if (error.message === "PHONE_PASSWORD_PROTECTED") {
        bot.sendMessage(chatId, "Please enter the password you received:");
        userStates[chatId] = { state: 'awaiting_password', phoneNumber, phoneCode: text };
    } else {
        bot.sendMessage(chatId, "Failed to verify code. Please try again.");
        console.error("Error verifying code:", error);
      }
    } 
}
else if (userState && userState.state === 'awaiting_password') {
    const phoneNumber = userState.phoneNumber || '';
    const phoneCode = userState.phoneCode || '';
      const password = text;
      try {
        await client.start({
            phoneNumber: async () => phoneNumber,
            password: async () => password,
            phoneCode: async () => phoneCode,
            onError: (err) => console.log("Error logging in: ", err),
          });
          const savedSession = client.session.save();
          client.disconnect();
          bot.sendMessage(chatId, `Successfully logged in! Here is your session string. DO NOT SHARE IT WITH ANYONE: ${savedSession}`);
          delete userStates[chatId];
      } catch (error) {
        bot.sendMessage(chatId, "Failed to verify password. Please try again.");
        console.error("Error verifying password:", error);
      }
    }
  });
  
  bot.onText(/\/reset/, (msg) => {
    const chatId = msg.chat.id;
    delete userStates[chatId];
    bot.sendMessage(chatId, "Session reset. Please /start again.");
  });