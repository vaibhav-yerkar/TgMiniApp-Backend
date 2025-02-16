import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

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

cron.schedule(
  "0 0 * * *",
  async () => {
    console.log("Resetting daily tasks");
    await resetDailyTasks();
  },
  { timezone: "Asia/Kolkata" }
);
