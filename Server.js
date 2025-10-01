import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import "./Utils/reminderCron.js";

import Error from "./Middleware/Error.js";
import mongoDb from "./Database/ConnectDb.js";
import userRoute from "./Route/UserRoute.js";
import todoRoute from "./Route/TodoRoute.js";
import { v2 } from "cloudinary";

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

v2.config({
  cloud_name: process.env.Cloud_Name,
  api_key: process.env.Cloud_API_Key,
  api_secret: process.env.API_Secret_Key,
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5174", "http://localhost:5173"],
    credentials: true,
  })
);

app.use("/api/v1", userRoute);
app.use("/api/v1", todoRoute);

app.get("/api/v1/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Backend is working perfectly!",
    timestamp: new Date().toISOString(),
  });
});

app.use(Error);

const server = app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
  mongoDb();
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  server.close(() => {
    process.exit(1);
  });
});
