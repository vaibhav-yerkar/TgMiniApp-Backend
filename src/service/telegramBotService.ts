import TelegramBot from "node-telegram-bot-api";
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  // ------------------------------------------------------------

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userFrom = msg.from;
    const userId = msg.from?.id;
    const username = msg.from?.username || "there";
    const firstName = msg.from?.first_name || username;
    // ------------------------------------------------------------
    if (msg.new_chat_members && chatId.toString() === COMMUNITY_CHAT_ID) {
      const chatInviteLink = (msg as any).invite_link?.invite_link;
      if (chatInviteLink && chatInviteLink.includes(TELEGRAM_COMMUNITY_LINK)) {
        const inviterIdMatch = chatInviteLink.match(
          new RegExp(`${TELEGRAM_COMMUNITY_LINK}?invite=(\\d+)`)
        );
        if (inviterIdMatch && inviterIdMatch[1]) {
          const inviterId = BigInt(inviterIdMatch[1]);
          try {
            const inviter = await prisma.inviteTrack.findUnique({
              where: { telegramId: inviterId },
            });

            for (const newMember of msg.new_chat_members) {
              const newMemberId = BigInt(newMember.id);
              const newMemberUsername =
                newMember.username || newMember.first_name || "Unknown";

              const existingUser = await prisma.inviteTrack.findUnique({
                where: { telegramId: newMemberId },
              });
              if (!existingUser) {
                await prisma.inviteTrack.create({
                  data: {
                    telegramId: newMemberId,
                    username: newMemberUsername,
                    Invites: [],
                  },
                });
              }
              if (inviter) {
                const updateInvites = inviter.Invites.includes(newMemberId)
                  ? inviter.Invites
                  : [...inviter.Invites, newMemberId];
                await prisma.inviteTrack.update({
                  where: { telegramId: inviterId },
                  data: {
                    Invites: updateInvites,
                  },
                });
              }
              const user = await prisma.users.findUnique({
                where: { telegramId: inviterId },
              });
              if (user) {
                await prisma.users.update({
                  where: { telegramId: inviterId },
                  data: {
                    totalScore: {
                      increment: parseInt(
                        process.env.INVITE_REWARD_AMOUNT as string
                      ),
                    },
                    inviteScore: {
                      increment: parseInt(
                        process.env.INVITE_REWARD_AMOUNT as string
                      ),
                    },
                    Invitees: { push: newMemberId },
                  },
                });
              }
            }
          } catch (err) {
            console.log("Error in updating invite track:", err);
          }
        }
      }
    }

    // ------------------------------------------------------------
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
          const inviteLink = TELEGRAM_COMMUNITY_LINK + `?invite=${telegramId}`;
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
        if (TELEGRAM_MINI_APP) {
          bot.sendMessage(
            chatId,
            `Welcome ${escapeMarkdown(
              firstName
            )}!\n\nWelcome to the Zo community — a dynamic platform where you can chat, create, and collaborate. Zo is an AI-powered group chat app that allows you to interact with friends, build custom AI mini-apps, and earn rewards for active participation.\n\nAvailable Commands:\n
      \t/start - Open the Mini App\n
      \t/leaderboard - View the current leaderboard\n
      \t/tasks - See recent tasks and updates\n
      \t/invite - Invite your friends to earn rewards
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

  return bot;
};
