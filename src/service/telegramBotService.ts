import TelegramBot from "node-telegram-bot-api";

export const initlialiseTelegramBot = async () => {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  let TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
  const COMMUNITY_CHAT_ID = process.env.TELEGRAM_COMMUNITY_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing");
  }
  if (!COMMUNITY_CHAT_ID) {
    throw new Error("COMMUNITY_CHAT_ID is missing");
  }

  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

  bot.on("polling_error", (error) => {
    console.error("Polling error:", error);
  });

  if (!TELEGRAM_BOT_USERNAME) {
    const me = await bot.getMe();
    TELEGRAM_BOT_USERNAME = me.username;
  }

  bot.on("message", (msg) => {
    const chatId = msg.chat.id;

    if (chatId.toString() !== COMMUNITY_CHAT_ID) {
      return;
    }

    const text = msg.text || "";

    if (
      TELEGRAM_BOT_USERNAME &&
      text.toLowerCase().includes(`@${TELEGRAM_BOT_USERNAME.toLowerCase()}`)
    ) {
      bot.sendMessage(chatId, "Hello! How can I help you today?");
    }
  });

  console.log("Telegram bot is running");
};
