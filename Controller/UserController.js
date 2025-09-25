import User from "../Model/UserModel";
import Errorhandler from "../utils/ErrorHandling";

export const registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new Errorhandler("All fields are required.", 400));
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new Errorhandler("User already exists.", 409));
    }

    const newUser = new User({ name, email, password });
    await newUser.save();
    const token = newUser.getJWTtoken();

    res
      .status(201)
      .cookie("token", token, {
        expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      })
      .json({
        success: true,
        message: "User registered successfully.",
        token,
        user: newUser,
      });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
});

export const loginUser = catchAsyncError(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new Errorhandler("User Not Found", 404));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new Errorhandler("Invalid Email or Password", 401));
    }

    const token = user.getJWTtoken();

    res
      .status(200)
      .cookie("token", token, {
        expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "None",
        secure: true,
      })
      .json({
        success: true,
        message: "User Logged In Successfully",
        user,
        token,
      });
  } catch (error) {
    next(error);
  }
});

export const GetallUsers = catchAsyncError(async (req, res, next) => {
  try {
    const users = await User.find();

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
});
