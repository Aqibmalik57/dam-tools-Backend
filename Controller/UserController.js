import User from "../Model/UserModel.js";
import Errorhandler from "../utils/ErrorHandling.js";
import { v2 } from "cloudinary";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

export const googleLogin = async (req, res, next) => {
  const { code } = req.body;
  if (!code) {
    return next(new Errorhandler("Authorization code is required", 400));
  }

  try {
    console.log("📥 Received code:", code);

    // Exchange code for tokens using the code only
    const { tokens } = await client.getToken(code);
    console.log("✅ Tokens received");

    if (!tokens.id_token) {
      return next(new Errorhandler("Missing ID token", 400));
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    if (!email || !name || !googleId) {
      return next(new Errorhandler("Invalid Google user data", 400));
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, googleId });
    }

    const jwtToken = user.getJWTtoken();
    console.log("🔐 JWT generated");

    res
      .status(200)
      .cookie("token", jwtToken, {
        expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
      })
      .json({ success: true, message: "Google login successful.", data: user });
  } catch (error) {
    console.error("🚨 Google login error:", error);
    return next(new Errorhandler("Failed to login with Google", 500));
  }
};

export const registerUser = async (req, res, next) => {
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
};

export const loginUser = async (req, res, next) => {
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
};

export const GetallUsers = async (req, res, next) => {
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
};

export const Logout = async (req, res, next) => {
  try {
    res.cookie("token", null, {
      httpOnly: true,
      expires: new Date(Date.now()),
    });

    res.status(201).json({
      success: true,
      message: "User Logged Out Successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const Myprofile = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return next(new Errorhandler("User not logged in", 400));
    }

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new Errorhandler("User not found", 404));
    }

    let imageUrl = user.profilePicture;

    if (req.file) {
      const imageBuffer = req.file.buffer;
      const imageBase64 = imageBuffer.toString("base64");

      const result = await new Promise((resolve, reject) => {
        const stream = v2.uploader.upload_stream(
          { resource_type: "image", folder: "profile_pictures" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(Buffer.from(imageBase64, "base64"));
      });

      imageUrl = result.secure_url;
    }

    const updatedData = {
      name: req.body.name || user.name,
      email: req.body.email || user.email,
      mobile: req.body.mobile || user.mobile,
      location: req.body.location || user.location,
      profilePicture: imageUrl,
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updatedData,
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "User Updated Successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, Password, ConfirmPassword } = req.body;

    if (!oldPassword || !Password || !ConfirmPassword) {
      return next(
        new Errorhandler("Please provide all the required fields", 400)
      );
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return next(new Errorhandler("User not found", 404));
    }

    const isPasswordMatch = await user.comparePassword(oldPassword);

    if (!isPasswordMatch) {
      return next(new Errorhandler("Old password is incorrect", 401));
    }

    if (Password !== ConfirmPassword) {
      return next(new Errorhandler("Passwords do not match", 400));
    }

    user.password = Password;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOwnProfile = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);

    if (!user) {
      return next(new Errorhandler("User not found", 404));
    }

    res.status(201).json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getsingleuser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new Errorhandler("User not found", 404));
    }

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new Errorhandler("User not found", 404));
    }

    res.status(201).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    next(error);
  }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    const updatedData = { name, email };

    const user = await User.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new Errorhandler("User not found", 404));
    }

    res.status(201).json({
      success: true,
      message: "User profile updated by admin successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const ForgotPassword = async (req, res, next) => {
  let user;

  try {
    const { email, origin } = req.body;
    console.log("Received email:", email);
    console.log("Received origin:", origin);

    if (!email || !origin) {
      return next(new Errorhandler("Email and origin are required", 400));
    }

    const allowedOrigins = [
      "https://site1.com",
      "https://site2.com",
      "http://localhost:5173",
      "http://localhost:5174",
    ];

    if (!allowedOrigins.includes(origin)) {
      return next(new Errorhandler("Invalid origin provided", 403));
    }

    user = await User.findOne({ email });
    console.log("Found user:", user);

    if (!user) {
      return next(new Errorhandler("No account with this email", 404));
    }

    const resetPasswordToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetPasswordURL = `${origin}/reset-password/${resetPasswordToken}`;
    console.log("Reset URL:", resetPasswordURL);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const message = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6f9fc; padding: 40px;">
    <div style="max-width: 620px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
      
      <div style="background-color: #2a9d8f; color: #ffffff; padding: 30px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 26px;">Reset Your Password</h1>
        <p style="margin: 10px 0 0; font-size: 16px;">For your PlantixAG account</p>
      </div>
      
      <div style="padding: 35px 30px; color: #333333;">
        <p style="font-size: 16px;">Hi there,</p>
        <p style="font-size: 16px; line-height: 1.6;">
          We received a request to reset your password for your <strong>PlantixAG</strong> account. To proceed, click the button below:
        </p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetPasswordURL}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #2a9d8f; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 6px; font-size: 16px; box-shadow: 0 3px 6px rgba(0,0,0,0.1);">
            Reset Password
          </a>
        </div>

        <p style="font-size: 15px; color: #555555;">
          If you didn’t request this password reset, feel free to ignore this message — your account is still secure.
        </p>

        <p style="margin-top: 30px; font-size: 15px;">
          Best regards,<br/>
          <strong>The PlantixAG Team</strong>
        </p>
      </div>

      <div style="background-color: #f2f4f6; text-align: center; padding: 20px; font-size: 13px; color: #999999;">
        &copy; ${new Date().getFullYear()} PlantixAG. All rights reserved.<br/>
        <span style="font-size: 12px;">Need help? Contact us at <a href="mailto:support@plantixag.com" style="color: #2a9d8f; text-decoration: none;">support@plantixag.com</a></span>
      </div>

    </div>
  </div>
`;

    await transporter.sendMail({
      from: `"Plantix Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: message,
    });

    res.status(200).json({
      success: true,
      message: `Password reset email sent to ${email}`,
    });
  } catch (error) {
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }

    console.error("ForgotPassword Error:", error);
    return next(new Errorhandler("Failed to send reset password email", 500));
  }
};

export const ResetPassword = async (req, res, next) => {
  console.log("Request body:", req.body);
  const token = req.params.token;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({ resetPasswordToken });

  if (!user || !user.resetPasswordExpires) {
    return next(
      new Errorhandler("Invalid or expired reset password token", 400)
    );
  }

  const { newPassword, confirmPassword } = req.body || {};

  if (!newPassword || !confirmPassword) {
    return next(
      new Errorhandler("Please provide new and confirm password", 400)
    );
  }

  if (newPassword !== confirmPassword) {
    return next(new Errorhandler("Passwords do not match", 400));
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
};
