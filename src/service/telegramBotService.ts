import TelegramBot from "node-telegram-bot-api";
import express from "express";

export const initlialiseTelegramBot = async (app?: express.Express) => {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  let TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
  const COMMUNITY_CHAT_ID = process.env.TELEGRAM_COMMUNITY_CHAT_ID;
  const WEBHOOK_URL = process.env.WEBHOOK_URL;
  const isProduction = process.env.NODE_ENV === "production";

  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing");
  }
  if (!COMMUNITY_CHAT_ID) {
    throw new Error("COMMUNITY_CHAT_ID is missing");
  }

  let bot: TelegramBot;

  if (isProduction && WEBHOOK_URL && app) {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

    await bot.setWebHook(`${WEBHOOK_URL}/telegram-bot`);
    app.post(`/bot${TELEGRAM_BOT_TOKEN}`, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
    console.log("Telegram bot is running in production mode");
  } else {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {
      polling: {
        interval: 3000,
        autoStart: true,
        params: {
          timeout: 10,
        },
      },
    });
    bot.on("polling_error", (error: any) => {
      if (error.code !== "EFATAL" && !error.message?.includes("409")) {
        console.error("Polling error:", error);
      }
    });

    console.log("Telegram bot is running in polling mode");
  }

  if (!TELEGRAM_BOT_USERNAME) {
    try {
      const me = await bot.getMe();
      TELEGRAM_BOT_USERNAME = me.username;
    } catch (error) {
      console.error("Error in getting bot username:", error);
    }
  }

  bot.on("message", (msg) => {
    const chatId = msg.chat.id;

    // if (chatId.toString() !== COMMUNITY_CHAT_ID) {
    //   return;
    // }

    const text = msg.text || "";

    if (
      TELEGRAM_BOT_USERNAME &&
      text.toLowerCase().includes(`@${TELEGRAM_BOT_USERNAME.toLowerCase()}`)
    ) {
      bot.sendMessage(chatId, "Hello! How can I help you today?");
    }
  });

  return bot;
};
