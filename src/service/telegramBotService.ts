import TelegramBot from "node-telegram-bot-api";
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const initlialiseTelegramBot = async (app?: express.Express) => {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  let TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
  const COMMUNITY_CHAT_ID = process.env.TELEGRAM_COMMUNITY_CHAT_ID;
  const WEBHOOK_URL = process.env.WEBHOOK_URL;
  const isProduction = process.env.NODE_ENV === "production";
  const TELEGRAM_MINI_APP = process.env.TELEGRAM_MINI_APP;

  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing");
  }
  if (!COMMUNITY_CHAT_ID) {
    throw new Error("COMMUNITY_CHAT_ID is missing");
  }

  let bot: TelegramBot;

  if (isProduction && WEBHOOK_URL && app) {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

    const webhookPath = `/bot${TELEGRAM_BOT_TOKEN}`;
    const webhookUrl = `${WEBHOOK_URL}${webhookPath}`;

    await bot.setWebHook(webhookUrl);
    console.log("Webhook set:", webhookUrl);

    app.post(webhookPath, (req, res) => {
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

  // Helper Functions ----------------------------------

  const escapeMarkdown = (text: string): string => {
    return text
      .replace(/_/g, "\\_")
      .replace(/\*/g, "\\*")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/`/g, "\\`");
  };

  const formatLeaderBoard = async (telegramId: number): Promise<string> => {
    try {
      const currentUser = await prisma.users.findUnique({
        where: { telegramId: BigInt(telegramId) },
        select: { username: true, totalScore: true },
      });
      if (!currentUser) {
        return "You are not registered in our system";
      }

      const topUsers = await prisma.users.findMany({
        select: { username: true, totalScore: true, telegramId: true },
        orderBy: { totalScore: "desc" },
        take: 3,
      });
      const allUsers = await prisma.users.findMany({
        select: { id: true, totalScore: true },
        orderBy: { totalScore: "desc" },
      });
      const userRank =
        allUsers.findIndex((u) => u.totalScore <= currentUser.totalScore) + 1;

      return (
        "🏆 *Leaderboard* 🏆\n\n" +
        topUsers
          .map(
            (user, index) =>
              `${index + 1}. ${escapeMarkdown(user.username)} - ${
                user.totalScore
              } points`,
          )
          .join("\n") +
        `\n\n🎯 *Your Position*: #${userRank} ${escapeMarkdown(
          currentUser.username,
        )} with ${currentUser.totalScore} points`
      );
    } catch (err) {
      return "Sorry, I am unable to fetch the leaderboard at the moment. Please try again later.";
    }
  };

  const getRecentTasks = async (): Promise<string> => {
    try {
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const tasks = await prisma.tasks.findMany({
        where: { createadAt: { gte: fourDaysAgo } },
        orderBy: { createadAt: "desc" },
      });

      if (tasks.length === 0) {
        return "No recent tasks available";
      }

      return (
        "📋 *Recent Tasks* 📋\n\n" +
        tasks
          .map(
            (task, index) =>
              `${index + 1}. *${escapeMarkdown(task.title)}* (${
                task.points
              } pts)\n   ${
                task.description
                  ? escapeMarkdown(task.description)
                  : "No description"
              }\n   Type: ${escapeMarkdown(task.type)}\n`,
          )
          .join("\n")
      );
    } catch (err) {
      return "Sorry, I couldn't fetch the recent tasks at the moment. Please try again later.";
    }
  };
  // ---------------------------------------------------

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    // if (chatId.toString() !== COMMUNITY_CHAT_ID) {
    //   return;
    // }
    const text = msg.text || "";
    const userId = msg.from?.id;
    const username = msg.from?.username || "there";
    const firstName = msg.from?.first_name || username;

    const isBotMentioned =
      TELEGRAM_BOT_USERNAME &&
      (text.toLowerCase().includes(`@${TELEGRAM_BOT_USERNAME.toLowerCase()}`) ||
        text.match(new RegExp(`\\/\\w+@${TELEGRAM_BOT_USERNAME}`, "i")));

    if (!isBotMentioned && msg.chat.type !== "private") {
      return;
    }

    if (text.includes("/start")) {
      try {
        const isPrivateChat = msg.chat.type === "private";

        if (TELEGRAM_MINI_APP) {
          if (isPrivateChat) {
            bot.sendMessage(
              chatId,
              `Welcome ${escapeMarkdown(
                firstName,
              )}! Let's get you started with our Mini App.`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "🚀 Open Mini App",
                        web_app: { url: TELEGRAM_MINI_APP },
                      },
                    ],
                  ],
                },
              },
            );
          } else {
            bot.sendMessage(
              chatId,
              `Welcome ${escapeMarkdown(
                firstName,
              )}! To use the Mini App, please start a private chat with me.`,
              {
                parse_mode: "Markdown",
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "🚀 Start Private Chat",
                        url: `https://t.me/${TELEGRAM_BOT_USERNAME}`,
                      },
                    ],
                  ],
                },
              },
            );
          }
        } else {
          bot.sendMessage(
            chatId,
            `Welcome ${escapeMarkdown(
              firstName,
            )}! Unfortunately, the Mini App URL is not configured.`,
          );
        }
        return;
      } catch (error) {
        bot.sendMessage(chatId, "Sorry, I couldn't start the Mini App.");
      }
    }

    // Command: /leaderboard
    if (text.includes("/leaderboard")) {
      if (userId) {
        const leaderboardText = await formatLeaderBoard(userId);
        bot.sendMessage(chatId, leaderboardText, { parse_mode: "Markdown" });
      } else {
        bot.sendMessage(chatId, "Sorry, I couldn't identify you.");
      }
      return;
    }

    // Command: /task or /tasks
    if (text.includes("/task")) {
      const tasksText = await getRecentTasks();
      bot.sendMessage(chatId, tasksText, { parse_mode: "Markdown" });
      return;
    }

    const commandsList =
      `Hello ${escapeMarkdown(
        firstName,
      )}! Here are the available commands:\n\n` +
      `/start - Open the Mini App\n` +
      `/leaderboard - View the current leaderboard\n` +
      `/tasks - See recent tasks`;
    bot.sendMessage(chatId, commandsList);
  });

  return bot;
};
