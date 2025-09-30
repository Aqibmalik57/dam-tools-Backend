import express from "express";
import {
  clearAllTodos,
  createTodo,
  deleteTodo,
  editTodo,
  markTodoCompleted,
} from "../Controller/TodoController.js";

const router = express.Router();

router.post("/createTodos", createTodo);
router.put("/editTodos/:id", editTodo);
router.patch("/todos/:id/complete", markTodoCompleted);
router.delete("/deleteTodos/:id", deleteTodo);
router.delete("/clearAllTodos", clearAllTodos);

export default router;
