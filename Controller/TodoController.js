import Todo from "../Model/TodoModel.js";

export const createTodo = async (req, res) => {
  try {
    const { topic, subtasks, date } = req.body;

    // Calculate day from date
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

    const newTodo = new Todo({ topic, subtasks, date: parsedDate, day });
    await newTodo.save();

    res.status(201).json({
      message: "Todo created successfully",
      todo: newTodo,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating todo", error });
  }
};

export const editTodo = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedData = {};
    if (req.body.topic !== undefined) updatedData.topic = req.body.topic;
    if (req.body.subtasks !== undefined)
      updatedData.subtasks = req.body.subtasks;
    if (req.body.date !== undefined) updatedData.date = req.body.date;
    if (req.body.day !== undefined) updatedData.day = req.body.day;

    const updatedTodo = await Todo.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({
      message: "Todo updated successfully",
      todo: updatedTodo,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating todo", error });
  }
};

export const markTodoCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findByIdAndUpdate(
      id,
      { $set: { completed: true } },
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({
      message: "Todo marked as completed",
      todo,
    });
  } catch (error) {
    res.status(500).json({ message: "Error marking todo completed", error });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findByIdAndDelete(id);

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({
      message: "Todo deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting todo", error });
  }
};

export const clearAllTodos = async (req, res) => {
  try {
    await Todo.deleteMany({});

    res.json({
      message: "All todos cleared successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Error clearing todos", error });
  }
};
