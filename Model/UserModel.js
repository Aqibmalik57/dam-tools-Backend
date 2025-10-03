import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import validator from "validator";
import jwt from "jsonwebtoken";
import crypto from "crypto";

function generateUniqueUserId() {
  const random = crypto.randomBytes(3).toString("hex");
  return `USR-${Date.now()}-${random}`;
}

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    default: null,
  },

  userId: {
    type: String,
    unique: true, // make sure it's unique
  },

  profilePicture: {
    type: String,
  },

  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email address"],
  },

  password: {
    type: String,
    minlength: 6,
  },

  mobile: {
    type: String,
    minlength: 10,
    default: null,
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  location: {
    type: String,
    default: null,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  resetPasswordToken: String,

  resetPasswordExpires: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 🔹 Hash password before saving
userSchema.pre("save", async function (next) {
  // Generate userId only if new
  if (this.isNew && !this.userId) {
    this.userId = generateUniqueUserId();
  }

  if (this.isModified("password") && this.password) {
    this.password = await bcryptjs.hash(this.password, 10);
  }
  next();
});

// 🔹 Compare password method
userSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false;
  return await bcryptjs.compare(password, this.password);
};

// 🔹 JWT token generator
userSchema.methods.getJWTtoken = function () {
  return jwt.sign({ id: this._id }, process.env.JwT_Secret, {
    expiresIn: process.env.JwT_Expire,
  });
};

// 🔹 Reset password token generator
userSchema.methods.getResetPasswordToken = function () {
  const token = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

  return token;
};

const User = mongoose.model("User", userSchema);
export default User;
