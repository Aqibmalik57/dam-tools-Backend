import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    subtasks: [
      {
        title: { type: String, required: true },
        done: { type: Boolean, default: false },
      },
    ],
    date: { type: Date, required: true },
    day: { type: String, required: true },
    completed: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Todo = mongoose.model("Todo", todoSchema);

export default Todo;
