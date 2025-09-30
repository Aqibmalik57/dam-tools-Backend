import cron from "node-cron";
import moment from "moment-timezone";
import Todo from "../Model/TodoModel.js";
import { sendEmail } from "./TransportFile.js";

const PK_TZ = "Asia/Karachi";

const sendTodoReminders = async (hour) => {
  try {
    const today = moment().tz(PK_TZ).startOf("day");

    const todos = await Todo.find({
      date: {
        $gte: today.toDate(),
        $lt: moment(today).add(1, "day").toDate(),
      },
    }).populate("userId", "email");

    if (!todos.length) {
      console.log("✅ No todos for today");
      return;
    }

    for (const todo of todos) {
      if (!todo.userId || !todo.userId.email) {
        console.log(`⚠️ Skipping todo ${todo._id} (no user email)`);
        continue;
      }

      const taskList = todo.subtasks
        .map((t, i) => `<li style="margin: 5px 0; font-size: 15px;">${t}</li>`)
        .join("");

      const message = `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background: #f9f9f9; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #4CAF50; text-align: center; margin-bottom: 10px;">📌 Todo Reminder</h2>
          <p style="font-size: 16px; text-align: center; margin-top: 0;">
            <strong>Date:</strong> ${moment(todo.date)
              .tz(PK_TZ)
              .format("YYYY-MM-DD (dddd)")}
          </p>
          <div style="background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-bottom: 10px;">${todo.topic}</h3>
            <ul style="padding-left: 20px; margin: 0;">${taskList}</ul>
          </div>
          <p style="font-size: 14px; color: #777; margin-top: 20px; text-align: center;">
            Stay productive 💪<br/>Your Todo App
          </p>
        </div>
      `;

      await sendEmail(
        todo.userId.email,
        `Todo Reminder (${hour}:00 PKT)`,
        message
      );
      console.log(`📧 Reminder sent to ${todo.userId.email} at ${hour}:00 PKT`);
    }
  } catch (error) {
    console.error("❌ Error in reminder job:", error);
  }
};

// Schedule reminders
cron.schedule(
  "0 10 * * *",
  () => {
    console.log("⏰ Running 10 AM reminder...");
    sendTodoReminders(10);
  },
  { timezone: PK_TZ }
);

cron.schedule(
  "0 17 * * *",
  () => {
    console.log("⏰ Running 5 PM reminder...");
    sendTodoReminders(17);
  },
  { timezone: PK_TZ }
);
