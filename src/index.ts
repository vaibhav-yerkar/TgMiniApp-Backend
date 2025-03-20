import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cron from "node-cron";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { initlialiseTelegramBot } from "./service/telegramBotService";
import {
  resetDailyTasks,
  sendReminderNotifications,
  initializeTwitterTaskScheduler,
} from "./config/cron-work";

import adminRouter from "./router/adminRouter";
import taskRouter from "./router/taskRouter";
import authRouter from "./router/authRouter";
import userRouter from "./router/userRouter";
import apiRouter from "./router/apiRouter";
import announcemetRouter from "./router/announcementRouter";

console.log("Initailizing cron job");
cron.schedule(
  "0 0 * * *",
  () => {
    console.log("Running cron job");
    resetDailyTasks();
  },
  { timezone: "Asia/Kolkata" }
);
cron.schedule(
  "0 18 * * *",
  async () => {
    console.log("Sending reminder notifications");
    await sendReminderNotifications();
  },
  { timezone: "Asia/Kolkata" }
);

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/tasks", taskRouter);
app.use("/api", apiRouter);
app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/user", userRouter);
app.use("/anmt", announcemetRouter);

initlialiseTelegramBot(app).catch((err) => {
  console.error("Error in initialising telegram bot:", err);
});

// initializeTwitterTaskScheduler();

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
