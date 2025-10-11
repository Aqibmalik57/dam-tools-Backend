import mongoose from "mongoose";

const timerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetTime: {
    type: Date,
    required: true,
  },
  isNotified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Timer = mongoose.model("Timer", timerSchema);
export default Timer;
