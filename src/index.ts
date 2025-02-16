import express, { Express, Request, Response, NextFunction } from "express";
import swaggerUi from "swagger-ui-express";
import cron from "node-cron";
import cors from "cors";
import { swaggerSpec } from "./config/swagger";
import { resetDailyTasks } from "./config/cron-work";

import adminRouter from "./router/adminRouter";
import taskRouter from "./router/taskRouter";
import authRouter from "./router/authRouter";
import userRouter from "./router/userRouter";
import announcemetRouter from "./router/announcementRouter";

console.log("Initailizing cron job");
cron.schedule(
  "0 0 * * *",
  () => {
    console.log("Running cron job");
    resetDailyTasks();
  },
  { timezone: "IST" }
);

const app: Express = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

/**
 * @swagger
 * /api/keep-alive:
 *   get:
 *     summary: Keep alive endpoint
 *     tags: [Server API]
 *     description: Returns a status 200 to confirm the server is running.
 *     responses:
 *       200:
 *         description: Server is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server is alive
 */
app.get("/api/keep-alive", (req: Request, res: Response) => {
  res.status(200).json({ message: "Server is alive" });
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
