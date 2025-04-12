import TelegramBot from "node-telegram-bot-api";
import express from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

let botInstance: TelegramBot | null = null;

let botMessage: any;
try {
  const filePath = path.join(__dirname, "../bot_response.json");
  const fileData = fs.readFileSync(filePath, "utf8");
  botMessage = JSON.parse(fileData);
} catch (error) {
  console.log("Error loading bot messages : ", error);
}

export const initlialiseTelegramBot = async (app?: express.Express) => {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  let TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;
  const COMMUNITY_CHAT_ID = process.env.TELEGRAM_COMMUNITY_CHAT_ID;
  const WEBHOOK_URL = process.env.WEBHOOK_URL;
  const isProduction = process.env.NODE_ENV !== "development";
  const TELEGRAM_MINI_APP = process.env.TELEGRAM_MINI_APP;
  const TELEGRAM_COMMUNITY_LINK = process.env.TELEGRAM_COMMUNITY_LINK;

  // ------------------------------------------------------------

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
        where: { telegramId: BigInt(telegramId.toString()) },
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
              } points`
          )
          .join("\n") +
        `\n\n🎯 *Your Position*: #${userRank} ${escapeMarkdown(
          currentUser.username
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
        where: { createdAt: { gte: fourDaysAgo } },
        orderBy: { createdAt: "desc" },
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
              }\n   Type: ${escapeMarkdown(task.type)}\n`
          )
          .join("\n")
      );
    } catch (err) {
      return "Sorry, I couldn't fetch the recent tasks at the moment. Please try again later.";
    }
  };

  const createInviteLink = async (
    telegramId: bigint,
    username: string
  ): Promise<string | null> => {
    try {
      const result = await bot.createChatInviteLink(COMMUNITY_CHAT_ID, {
        name: `${telegramId.toString()}`,
        member_limit: 0,
        creates_join_request: true,
      });
      if (result.invite_link) {
        await prisma.inviteTrack.upsert({
          where: { telegramId },
          update: { InviteLink: result.invite_link },
          create: {
            telegramId,
            username: username,
            InviteLink: result.invite_link,
          },
        });
        return result.invite_link;
      }
      return null;
    } catch (error) {
      console.error("Error in creating invite link:", error);
      return null;
    }
  };

  const processSuccessfulInvite = async (
    inviterId: bigint,
    newUserId: bigint,
    username: string
  ) => {
    try {
      let inviter = await prisma.inviteTrack.findUnique({
        where: { telegramId: inviterId },
      });
      if (!inviter) {
        console.log("Inviter not found in the database");
      }
      if (!inviter?.Invites.includes(newUserId)) {
        await prisma.inviteTrack.update({
          where: { telegramId: inviterId },
          data: {
            Invites: [...inviter!.Invites, newUserId],
          },
        });
      }
      const newUser = await prisma.inviteTrack.create({
        data: {
          telegramId: newUserId,
          username,
        },
      });
      const user = await prisma.users.findUnique({
        where: { telegramId: inviterId },
      });
      if (user) {
        await prisma.users.update({
          where: { telegramId: inviterId },
          data: {
            totalScore: {
              increment: parseInt(process.env.INVITE_REWARD_AMOUNT as string),
            },
            inviteScore: {
              increment: parseInt(process.env.INVITE_REWARD_AMOUNT as string),
            },
            Invitees: { push: newUserId },
          },
        });
        bot
          .sendMessage(
            inviterId.toString(),
            `🎉 Congratulations! Someone joined using your invite link. You've earned ${process.env.INVITE_REWARD_AMOUNT} points!`
          )
          .catch((err) => console.error("Failed to send notification:", err));
      }
    } catch (err) {
      console.log("Error in processing successful invite:", err);
    }
  };

  // ------------------------------------------------------------
  // EVENT HANDLERS
  // ------------------------------------------------------------

  bot.on("chat_join_request", async (chatJoinRequest) => {
    if (chatJoinRequest.chat.id.toString() !== COMMUNITY_CHAT_ID) return;

    try {
      const userId = chatJoinRequest.from.id;
      const username =
        chatJoinRequest.from.username ||
        chatJoinRequest.from.first_name ||
        "Unknown";

      const inviteLink = chatJoinRequest.invite_link;
      if (inviteLink && inviteLink.name) {
        const inviterId = BigInt(inviteLink.name);
        await processSuccessfulInvite(inviterId, BigInt(userId), username);
      }

      bot.approveChatJoinRequest(COMMUNITY_CHAT_ID, userId);
    } catch (err) {
      console.error("Error in processing chat_join_request:", err);
    }
  });

  bot.on("chat_member", async (chatMember) => {
    try {
      if (chatMember.chat.id.toString() !== COMMUNITY_CHAT_ID) return;
      if (
        chatMember.new_chat_member.status === "member" &&
        ["left", "kicked"].includes(chatMember.old_chat_member.status)
      ) {
        const userId = chatMember.new_chat_member.user.id;
        const username =
          chatMember.new_chat_member.user.username ||
          chatMember.new_chat_member.user.first_name ||
          "Unknown";

        try {
          if (chatMember.invite_link?.name) {
            const inviterId = BigInt(chatMember.invite_link.name);
            await processSuccessfulInvite(inviterId, BigInt(userId), username);
          }
        } catch (err) {
          console.error("Error in processing invite link:", err);
        }
      }
    } catch (err) {
      console.log("Error in chat_member event:", err);
    }
  });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userFrom = msg.from;
    const userId = msg.from?.id;
    const username = msg.from?.username || "there";
    const firstName = msg.from?.first_name || username;
    const text = msg.text || "";

    if (msg.chat.type !== "private") return;
    if (text === "/invite") {
      if (userId) {
        try {
          const telegramId = BigInt(userId);
          let user = await prisma.inviteTrack.findUnique({
            where: { telegramId },
          });
          if (!user) {
            user = await prisma.inviteTrack.create({
              data: {
                telegramId,
                username,
                Invites: [],
              },
            });
          }
          const inviteLink = await createInviteLink(telegramId, user.username);
          bot.sendMessage(
            chatId,
            `Your invite link is :\n ${inviteLink}\n\n Share this link to invite others to our community and start earning rewards!`
          );
          return;
        } catch (err) {
          console.log("Error in generating invite link:", err);
          bot.sendMessage(
            chatId,
            "Sorry, I couldn't generate your invite link."
          );
          return;
        }
      } else {
        bot.sendMessage(chatId, "Sorry, I couldn't identify you.");
        return;
      }
    }
    if (text === "/start") {
      try {
        const user = await prisma.inviteTrack.findFirst({
          where: { telegramId: BigInt(userId!.toString()) },
        });
        if (!user) {
          await prisma.inviteTrack.create({
            data: {
              telegramId: BigInt(userId!.toString()),
              username: firstName,
            },
          });
        }
        if (TELEGRAM_MINI_APP) {
          bot.sendMessage(
            chatId,
            `Hello ${escapeMarkdown(firstName)}!\n\n ${botMessage.start.message}
            \n\n Let's get you started with Zo App.`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🚀 Open The Zo App",
                      web_app: { url: TELEGRAM_MINI_APP },
                    },
                  ],
                ],
              },
            }
          );
        } else {
          bot.sendMessage(
            chatId,
            `Welcome ${escapeMarkdown(
              firstName
            )}!\n Unfortunately, the Zo App URL is not configured.`
          );
        }
        return;
      } catch (error) {
        bot.sendMessage(chatId, "Sorry, I couldn't start the Zo App.");
      }
    }

    // Command: /leaderboard
    if (text === "/leaderboard") {
      if (userId) {
        const leaderboardText = await formatLeaderBoard(userId);
        bot.sendMessage(chatId, leaderboardText, { parse_mode: "Markdown" });
      } else {
        bot.sendMessage(chatId, "Sorry, I couldn't identify you.");
      }
      return;
    }

    // Command: /task or /tasks
    if (text === "/tasks") {
      const tasksText = await getRecentTasks();
      bot.sendMessage(chatId, tasksText, { parse_mode: "Markdown" });
      return;
    }

    const commandsList = `Hello ${escapeMarkdown(
      firstName
    )}!\n\nWelcome to the Zo community — a dynamic platform where you can chat, create, and collaborate. Zo is an AI-powered group chat app that allows you to interact with friends, build custom AI mini-apps, and earn rewards for active participation.\n\nAvailable Commands:\n
      \t/start - Open the Mini App\n
      \t/leaderboard - View the current leaderboard\n
      \t/tasks - See recent tasks and updates\n
      \t/invite - Invite your friends to earn rewards`;
    bot.sendMessage(chatId, commandsList);
  });

  botInstance = bot;
  return bot;
};

/**
 * Send a message to a specific chat ID
 * @param chatId The Telegram chat ID to send the message to
 * @param message The message text to send
 * @param options Optional send message options (parse_mode, reply_markup, etc.)
 * @returns The sent message or undefined if there was an error
 */
export const sendMessageToChat = async (
  chatId: number | string,
  message: string,
  options?: TelegramBot.SendMessageOptions
): Promise<TelegramBot.Message | undefined> => {
  if (!botInstance) {
    console.error(
      "Bot instance not initialized. Call initlialiseTelegramBot first."
    );
    return undefined;
  }

  try {
    return await botInstance.sendMessage(chatId, message, options);
  } catch (error) {
    console.error(`Error sending message to chat ${chatId}:`, error);
    return undefined;
  }
};
