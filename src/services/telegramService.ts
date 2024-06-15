export async function authenticateUser(phoneNumber: string, code: string) {
  // Call Telegram API to authenticate user and get session token
  // This is a placeholder, replace with actual Telegram API call
  return "session_token_placeholder";
}

export async function sendMessage(token: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });
  return response.json();
}
