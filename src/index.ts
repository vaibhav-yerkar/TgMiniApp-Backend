import express, { Express, Request, Response } from "express";
import { swaggerSpec } from "./config/swagger";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import cron from "node-cron";
import { resetDailyTasks } from "./config/cron-work";

import adminRouter from "./router/adminRouter";
import taskRouter from "./router/taskRouter";
import authRouter from "./router/authRouter";
import userRouter from "./router/userRouter";
import announcemetRouter from "./router/announcementRouter";

console.log("Initailizing cron job");
cron.schedule("0 0 * * *", () => {
  console.log("Running cron job");
  resetDailyTasks();
});

const app: Express = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/tasks", taskRouter);
app.use("/auth", authRouter);
app.use("/admin", adminRouter);
app.use("/user", userRouter);
app.use("/anmt", announcemetRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
