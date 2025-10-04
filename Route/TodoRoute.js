import express from "express";
import {
  clearAllTodos,
  createTodo,
  deleteTodo,
  editTodo,
  getAllTodos,
  toggleSubtask,
  toggleTodoCompleted,
} from "../Controller/TodoController.js";
import { isUserLoggedin } from "../utils/Auth.js";

const router = express.Router();

router.post("/createTodos", isUserLoggedin, createTodo);
router.put("/editTodos/:id", isUserLoggedin, editTodo);
router.patch("/todos/:id/toggleSubtask_status", isUserLoggedin, toggleSubtask);
router.patch("/todos/:id/toggle_status", isUserLoggedin, toggleTodoCompleted);
router.delete("/deleteTodos/:id", isUserLoggedin, deleteTodo);
router.delete("/clearAllTodos", isUserLoggedin, clearAllTodos);
router.get("/getallTodos/:id", isUserLoggedin, getAllTodos);

export default router;
