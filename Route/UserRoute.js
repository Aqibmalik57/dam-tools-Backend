import express from "express";
import {
  deleteOwnProfile,
  deleteUser,
  ForgotPassword,
  GetallUsers,
  getsingleuser,
  googleLogin,
  loginUser,
  Logout,
  Myprofile,
  registerUser,
  ResetPassword,
  updatePassword,
  updateProfile,
  updateUserProfile,
} from "../Controller/UserController.js";
import { isAuthenticated, isUserLoggedin } from "../utils/Auth.js";
import { upload } from "../utils/Multer.js";

const router = express.Router();

router.post("/auth/google-login", googleLogin);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/allUsers", isUserLoggedin, isAuthenticated("admin"), GetallUsers);
router.post("/logout", isUserLoggedin, Logout);
router.get("/profile", isUserLoggedin, Myprofile);
router.put(
  "/updateprofile",
  isUserLoggedin,
  upload.single("profilePicture"),
  updateProfile
);
router.put("/updatePassword", isUserLoggedin, updatePassword);
router.delete("/deleteProfile", isUserLoggedin, deleteOwnProfile);
router.get(
  "/singleUser/:id",
  isUserLoggedin,
  isAuthenticated("admin"),
  getsingleuser
);
router.delete(
  "/deleteUser/:id",
  isUserLoggedin,
  isAuthenticated("admin"),
  deleteUser
);
router.put(
  "/updateUser/:id",
  isUserLoggedin,
  isAuthenticated("admin"),
  updateUserProfile
);
router.post("/forgotPassword", ForgotPassword);
router.post("/resetPassword/:token", ResetPassword);

export default router;
