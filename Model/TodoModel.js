import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    subtasks: [{ type: String }],
    date: { type: Date, required: true },
    day: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Todo = mongoose.model("Todo", todoSchema);

export default Todo;
