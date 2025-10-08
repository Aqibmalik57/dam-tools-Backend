import Todo from "../Model/TodoModel.js";
import User from "../Model/UserModel.js";

// 🔹 Create a new Todo
export const createTodo = async (req, res) => {
  try {
    const { topic, subtasks, date } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const parsedDate = new Date(date);
    const day = dayNames[parsedDate.getDay()];

    const newTodo = new Todo({
      topic,
      subtasks: subtasks.map((s) =>
        typeof s === "string" ? { title: s, done: false } : s
      ),
      date: parsedDate,
      day,
      user: req.user._id,
    });

    await newTodo.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { todos: newTodo._id },
    });

    res.status(201).json({
      message: "Todo created successfully",
      todo: newTodo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating todo", error });
  }
};

export const editTodo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const todo = await Todo.findOne({ _id: id, user: req.user._id });
    if (!todo) {
      return res
        .status(404)
        .json({ message: "Todo not found or you don't have permission" });
    }

    if (req.body.topic !== undefined) todo.topic = req.body.topic;

    if (req.body.subtasks !== undefined) {
      todo.subtasks = req.body.subtasks.map((s) =>
        typeof s === "string" ? { title: s, done: false } : s
      );
    }

    if (req.body.date !== undefined) {
      todo.date = new Date(req.body.date);
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      todo.day = dayNames[todo.date.getDay()];
    }

    await todo.save();

    res.json({
      message: "Todo updated successfully",
      todo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating todo", error });
  }
};

export const toggleSubtask = async (req, res) => {
  try {
    const { subtaskIndex } = req.body;
    const { id: todoId } = req.params;

    const todo = await Todo.findOne({ _id: todoId, user: req.user._id });
    if (!todo) return res.status(404).json({ message: "Todo not found" });

    todo.subtasks[subtaskIndex].done = !todo.subtasks[subtaskIndex].done;
    await todo.save();

    res.json({ message: "Subtask updated", todo });
  } catch (error) {
    res.status(500).json({ message: "Error updating subtask", error });
  }
};

export const toggleTodoCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Please login to perform this action" });
    }

    const todo = await Todo.findOne({ _id: id, user: req.user._id });
    if (!todo) {
      return res
        .status(404)
        .json({ message: "Todo not found or you don't have permission" });
    }

    todo.completed = !todo.completed;
    await todo.save();

    res.json({
      message: `Todo marked as ${todo.completed ? "completed" : "pending"}`,
      todo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error toggling todo completion", error });
  }
};

// 🔹 Delete a Todo
export const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Please login" });
    }

    const todo = await Todo.findOneAndDelete({ _id: id, user: req.user._id });

    if (!todo) {
      return res
        .status(404)
        .json({ message: "Todo not found or you don't have permission" });
    }

    await User.findByIdAndUpdate(req.user._id, { $pull: { todos: id } });

    res.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting todo", error });
  }
};

// 🔹 Clear all Todos for a user
export const clearAllTodos = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not logged in" });
    }

    await Todo.deleteMany({ user: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { $set: { todos: [] } });

    res.json({ message: "All todos cleared successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error clearing todos", error });
  }
};

// 🔹 Get all Todos for a user
export const getAllTodos = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const todos = await Todo.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: todos.length,
      todos,
    });
  } catch (error) {
    console.error("❌ Error fetching todos:", error);
    res.status(500).json({ message: "Server error. Could not fetch todos." });
  }
};
