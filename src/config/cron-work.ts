import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { sendBulkNotifications } from "../service/notificationService";
import {
  createTwitterTask,
  removeExpiredTwitterTasks,
} from "../service/twitterService";

const prisma = new PrismaClient();

export const resetDailyTasks = async () => {
  try {
    const result = await prisma.users.updateMany({
      data: {
        taskCompleted: [],
        lastResetDate: new Date(),
      },
    });
    console.log(`Reset daily tasks for ${result.count} users`);
  } catch (error) {
    console.log("Error resetting the daily tasks: ", error);
  }
};

export const sendReminderNotifications = async () => {
  try {
    const users = await prisma.users.findMany({
      select: { id: true },
    });
    const userIds = users.map((user) => user.id);

    const title = "Daily Task Reset Reminder.";
    const message =
      "Time's ticking! Your daily tasks will disappear soon. Complete them now to claim your rewards!";
    await sendBulkNotifications(userIds, title, message);
    console.log("Reminder notifications sent successfully");
  } catch (error) {
    console.log("Error sending reminder notifications: ", error);
  }
};

/**
 * Initializes cron jobs:
 * - Every hour, fetch the latest tweet from "joinzo" and create a Twitter task.
 * - Every hour, remove Twitter tasks older than 24 hours.
 */
export function initializeTwitterTaskScheduler(): void {
  cron.schedule("*/20 * * * *", async () => {
    console.log("[Cron] Creating Twitter task");
    await createTwitterTask();
  });

  cron.schedule("*/20 * * * *", async () => {
    console.log("[Cron] Removing expired Twitter tasks");
    await removeExpiredTwitterTasks();
  });

  console.log("Twitter Task Scheduler initialized.");
}

cron.schedule(
  "0 0 * * *",
  async () => {
    console.log("Resetting daily tasks");
    await resetDailyTasks();
  },
  { timezone: "Asia/Kolkata" },
);

cron.schedule(
  "0 18 * * *",
  async () => {
    console.log("Sending reminder notifications");
    await sendReminderNotifications();
  },
  { timezone: "Asia/Kolkata" },
);
