import express from "express";
import { isUserLoggedin } from "../utils/Auth.js";
import { createTimer, stopTimer } from "../Controller/TimerController.js";

const router = express.Router();
router.post("/create-timer", isUserLoggedin, createTimer);
router.delete("/stop-timer", isUserLoggedin, stopTimer);

export default router;
