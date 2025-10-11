import Timer from "../Model/TimerModel.js";
import User from "../Model/UserModel.js";

export const createTimer = async (req, res) => {
  try {
    const { userId, targetTime } = req.body;

    if (!userId || !targetTime) {
      return res.status(400).json({
        success: false,
        message: "User ID and target time are required.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const newTimer = new Timer({
      user: userId,
      targetTime: new Date(targetTime),
    });

    await newTimer.save();

    res.status(201).json({
      success: true,
      message: "Timer set successfully!",
      timer: newTimer,
    });
  } catch (error) {
    console.error("Error creating timer:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating timer.",
    });
  }
};

export const stopTimer = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Find and delete the user's timer
    const deletedTimer = await Timer.findOneAndDelete({ user: userId });

    if (!deletedTimer) {
      return res.status(404).json({
        success: false,
        message: "No active timer found for this user.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Timer stopped and removed successfully.",
    });
  } catch (error) {
    console.error("Error stopping timer:", error);
    res.status(500).json({
      success: false,
      message: "Server error while stopping timer.",
    });
  }
};
