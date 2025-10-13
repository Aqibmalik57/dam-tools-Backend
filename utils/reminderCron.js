import cron from "node-cron";
import moment from "moment-timezone";
import Todo from "../Model/TodoModel.js";
import { sendEmail } from "./TransportFile.js";
import User from "../Model/UserModel.js";
import dotenv from "dotenv";
import axios from "axios";
import Timer from "../Model/TimerModel.js";

dotenv.config();

const PK_TZ = "Asia/Karachi";

const callTestApi = async () => {
  try {
    const response = await axios.get("http://localhost:8000/api/v1/test");
    console.log("✅ Test API Response:", response.data);
  } catch (error) {
    console.error("Error calling Test API:", error.message);
  }
};

const sendTodoReminders = async (timeLabel) => {
  try {
    const todayStart = moment().tz(PK_TZ).startOf("day");
    const todayEnd = moment(todayStart).add(1, "day");

    const users = await User.find({});

    if (!users.length) {
      console.log("⚠️ No users found in DB");
      return;
    }

    for (const user of users) {
      if (!user.email) continue;

      const todos = await Todo.find({
        user: user._id,
        date: {
          $gte: todayStart.toDate(),
          $lt: todayEnd.toDate(),
        },
      });

      if (!todos.length) continue;

      const tasksHtml = todos
        .map((todo) => {
          const subtaskTitles = todo.subtasks
            .map(
              (s) => `
              <li style="margin:6px 0; font-size:15px; color:${
                s.done ? "#4CAF50" : "#E53935"
              };">
                ${s.done ? "✅" : "❌"} ${s.title}
              </li>
            `
            )
            .join("");

          return `
            <div style="margin-bottom:20px; border-left:4px solid #4CAF50; padding-left:10px;">
              <h3 style="margin:0; font-size:18px; color:#333;">${todo.topic}</h3>
              <ul style="padding-left:20px; margin:10px 0; list-style-type:none;">
                ${subtaskTitles}
              </ul>
            </div>
          `;
        })
        .join("");

      const message = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding:30px 0; color:#333;">
  <div style="max-width:650px; margin: auto; background: #ffffff; border-radius:15px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4CAF50, #81C784); padding: 20px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:28px;">Todo Reminder</h1>
      <p style="color:#e8f5e9; font-size:16px; margin-top:5px;">Stay on track with your tasks today!</p>
    </div>
    
    <!-- Date -->
    <div style="padding:20px; border-bottom: 1px solid #e0e0e0; text-align:center;">
      <p style="margin:0; font-size:16px; color:#555;">
        <strong>Date:</strong> ${todayStart.format("YYYY-MM-DD (dddd)")}
      </p>
    </div>
    
    <!-- Tasks Section -->
    <div style="padding:20px;">
      ${
        tasksHtml
          ? tasksHtml
          : `<p style="color:#999; text-align:center;">No subtasks scheduled for today! 🎉</p>`
      }
    </div>
    
    <!-- Tips Section -->
    <div style="padding: 15px 20px; background:#f9f9f9; border-top:1px solid #e0e0e0;">
      <h3 style="margin:0 0 10px 0; color:#4CAF50; font-size:18px;">💡 Productivity Tip</h3>
      <p style="margin:0; font-size:14px; color:#555;">
        Prioritize your tasks, focus on one at a time, and take short breaks to boost your efficiency. You've got this!
      </p>
    </div>
    
    <!-- Footer -->
    <div style="padding:20px; text-align:center; font-size:12px; color:#888; background:#f0f4f8;">
      <p style="margin:5px 0;">Sent with ❤️ from DAM Tools</p>
    </div>
  </div>
</div>
`;

      await sendEmail(user.email, `Todo Reminder (${timeLabel})`, message);
      console.log(`📧 Reminder sent to ${user.email} at ${timeLabel}`);
    }
  } catch (error) {
    console.error("❌ Error in reminder job:", error);
  }
};

// cron.schedule(
//   "40 21 * * *",
//   () => {
//     console.log("⏰ Running 9:40 PM reminder...");
//     sendTodoReminders("21:40 PKT");
//   },
//   { timezone: PK_TZ }
// );

cron.schedule(
  "0 10 * * *",
  () => {
    console.log("⏰ Running 10 AM reminder...");
    sendTodoReminders("10:00 PKT");
  },
  { timezone: PK_TZ }
);

cron.schedule(
  "0 17 * * *",
  () => {
    console.log("⏰ Running 5 PM reminder...");
    sendTodoReminders("17:00 PKT");
  },
  { timezone: PK_TZ }
);

cron.schedule(
  "0 0 1,13,25 * *", // 1st, 13th, 25th of each month
  () => {
    console.log("🔄 Running Test API call (every 12 days)...");
    callTestApi();
  },
  { timezone: PK_TZ }
);

const sendTimerMails = async () => {
  try {
    const now = moment().tz(PK_TZ);
    const expiredTimers = await Timer.find({
      isNotified: false,
      targetTime: { $lte: now.toDate() },
    }).populate("user");

    for (const timer of expiredTimers) {
      if (!timer.user || !timer.user.email) continue;
      const msg = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f7fb; padding: 10px;">
    <div style="max-width: 700px; margin: auto; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.15);">
      
      <!-- Header Section -->
      <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); padding: 30px 20px; text-align: center; color: #fff;">
        <h1 style="margin: 0; font-size: 28px;">Your Countdown Has Ended!</h1>
        <p style="margin-top: 8px; font-size: 16px; color: #e8f5e9;">A friendly reminder from DAM Tools</p>
      </div>

      <!-- Body Section -->
      <div style="padding: 30px 25px; color: #333; line-height: 1.6;">
        <p style="font-size: 17px;">Hey <strong>${timer.user.name}</strong>,</p>
        <p style="font-size: 16px;">Your timer has just reached its target time. Here are the details:</p>

        <div style="background: #f0f8f5; border-left: 5px solid #4CAF50; padding: 15px 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0; font-size: 15px;">
            <strong>Target Time:</strong> ${moment(timer.targetTime).format(
              "YYYY-MM-DD hh:mm A"
            )}
          </p>
        </div>

        <p style="font-size: 16px;">Remember, every second counts — use this moment to review your progress or move to your next goal. Stay focused, and keep the momentum going!</p>

        <div style="margin-top: 25px; text-align: center;">
          <a href="https://dam-notes-tools.vercel.app/" style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: #fff; padding: 12px 25px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
            Open DAM Tools
          </a>
        </div>
      </div>

      <!-- Footer Section -->
      <div style="background: #f7f9fc; text-align: center; padding: 20px 15px; font-size: 13px; color: #777;">
        <hr style="border:none; border-top:1px solid #e0e0e0; margin-bottom:15px;">
        <p style="margin: 0;">Sent by <strong>DAM Tools</strong></p>
        <p style="margin: 5px 0;">Boost your productivity — one timer at a time ⏳</p>
      </div>

    </div>
  </div>
`;

      await sendEmail(timer.user.email, "⏰ Your Countdown Timer Ended", msg);

      timer.isNotified = true;
      await timer.save();

      console.log(`📨 Timer ended email sent to ${timer.user.email}`);
    }
  } catch (error) {
    console.error("❌ Error checking timers:", error);
  }
};

cron.schedule(
  "* * * * *",
  () => {
    sendTimerMails();
  },
  { timezone: PK_TZ }
);
