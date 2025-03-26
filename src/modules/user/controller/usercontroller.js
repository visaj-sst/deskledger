import UserModel from "../model/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import TokenModel from "../model/tokenModel.js";
import nodemailer from "nodemailer";
import PasswordResetTokenModel from "../model/passwordResetTokenModel.js";
import { statusCode, message } from "../../../utils/api.response.js";
import FixedDepositModel from "../../fixed-deposit/model/fixedDeposit.js";
import generateOtp from "../../../helpers/otp.js";
import logger from "../../../service/logger.service.js";
import mongoose from "mongoose";

//====================== REGISTER USER ======================//

export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, phoneNo, email, password } = req.body;

    const userExists = await UserModel.findOne({ email });

    if (userExists) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.userExists,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      firstName,
      lastName,
      phoneNo,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.userCreated,
      data: { ...savedUser.toObject(), password: undefined },
    });
  } catch (error) {
    console.log("Error Register User", error);
    logger.error(`Error registering user: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorRegisteringUser,
    });
  }
};

//====================== LOGIN USER ======================//

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password.",
      });
    }

    await TokenModel.findOneAndDelete({ userId: user._id });

    const token = jwt.sign({ id: user._id }, process.env.SECRET);

    const tokenDoc = new TokenModel({ token, userId: user._id });
    await tokenDoc.save();

    return res.status(200).json({
      message: "Login successful",
      data: {
        token,
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNo: user.phoneNo,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error(`Error logging in user: ${error.message}`);
    return res.status(500).json({
      message: "An error occurred during login.",
    });
  }
};

//====================== VIEW USER ======================//

export const getUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await UserModel.findById(id, { password: 0 });
    if (!user) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.userView,
      data: user,
    });
  } catch (error) {
    logger.error(`Error fetching user: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorLogin,
      error,
    });
  }
};

//====================== UPDATE USER ======================//

export const updateUser = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: "Please upload a valid image file",
      });
    }

    if (req.fileSizeLimitError) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: "File size should be less than 5 MB.",
      });
    }

    const { firstName, lastName, phoneNo, email } = req.body;
    const profileImage = req.file ? req.file.path : null;

    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phoneNo = phoneNo || user.phoneNo;
    user.email = email || user.email;
    if (profileImage) {
      user.profileImage = profileImage;
    }

    await user.save();

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.userProfileUpdated,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNo: user.phoneNo,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorUserProfile,
    });
  }
};
//====================== DELETE USER ======================//

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (req.user.id !== userId) {
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.deleteAuth,
      });
    }

    await FixedDepositModel.deleteMany({ userId });

    const deletedUser = await UserModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    res
      .status(statusCode.OK)
      .json({ statusCode: statusCode.OK, message: message.userDeleted });
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.deleteUserError,
    });
  }
};

//====================== CHANGE PASSWORD ======================//
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    const isMatch = bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.incorrectOldPassword,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.passwordNotMatch,
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    await TokenModel.deleteMany({ userId: userId });

    res
      .status(statusCode.OK)
      .json({ statusCode: statusCode.OK, message: message.passwordChanged });
  } catch (err) {
    logger.error(
      `Error changing password for user ${req.user.id}: ${err.message}`
    );
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.passwordChangeError,
    });
  }
};

//====================== FORGOT PASSWORD ======================//

export const forgotPassword = async (req, res) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.userNotFound,
      });
    }

    const otp = generateOtp();

    const passwordResetToken = new PasswordResetTokenModel({
      token: otp,
      userId: user._id,
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });

    await passwordResetToken.save();

    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset Request",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
            color: #333333;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-header {
            background-color: #1a73e8;
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .email-body {
            background-color: white;
            padding: 30px;
            border-left: 1px solid #e0e0e0;
            border-right: 1px solid #e0e0e0;
        }
        .email-footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #757575;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e0e0e0;
            border-top: none;
        }
        .otp-container {
            background-color: #f0f7ff;
            border: 1px solid #d0e3ff;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .otp-code {
            font-size: 32px;
            letter-spacing: 5px;
            font-weight: 600;
            color: #1a73e8;
            margin: 10px 0;
        }
        .button {
            background-color: #1a73e8;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            display: inline-block;
            margin: 20px 0;
        }
        .info-text {
            color: #757575;
            font-size: 14px;
            margin-top: 20px;
        }
        h1 {
            margin: 0;
            font-weight: 400;
            font-size: 24px;
        }
        p {
            margin: 15px 0;
        }
        .logo {
            height: 40px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-header">
            <img src="src/images/appLogo.png" alt="Company Logo" class="logo" />
            <h1>Password Reset Request</h1>
        </div>
        <div class="email-body">
            <p>Hello ${user.firstName},</p>
            <p>We received a request to reset your password. Please use the verification code below to complete the password reset process:</p>
            
            <div class="otp-container">
                <p>Your One-Time Password</p>
                <div class="otp-code">${otp}</div>
                <p>This code will expire in 15 minutes</p>
            </div>
            
            <p>If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.</p>
            
            <p class="info-text">For security reasons, this OTP is valid for a limited time only. Please do not share this code with anyone.</p>
        </div>
        <div class="email-footer">
            <p>&copy; 2025 Your Company Name. All rights reserved.</p>
            <p>123 Business Street, Suite 100, City, Country</p>
        </div>
    </div>
</body>
</html>`,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(statusCode.OK)
      .json({ statusCode: statusCode.OK, message: message.resetPasswordSend });
  } catch (error) {
    logger.error(`Error sending password reset email: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorSendingPasswordResetEmail,
    });
  }
};

//====================== RESET PASSWORD ======================//

export const resetPassword = async (req, res) => {
  try {
    const { otp } = req.body;

    const resetToken = await PasswordResetTokenModel.findOne({ token: otp });

    if (!resetToken) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.otpInvalid,
      });
    }

    if (resetToken.expires < Date.now()) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: "Expired OTP",
      });
    }

    const user = await UserModel.findById(resetToken.userId);

    if (!user) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.otpSuccess,
      userId: user._id,
    });
  } catch (error) {
    logger.error(`Error validating OTP for password reset: ${error.message}`);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.resetPasswordError,
    });
  }
};

//====================== NEW PASSWORD ======================//

export const newPassword = async (req, res) => {
  try {
    const { userId, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.passwordNotMatch,
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    await PasswordResetTokenModel.findOneAndDelete({ userId });

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.passwordChanged,
    });
  } catch (error) {
    logger.error(
      `Error changing password for user ${req.body.userId}: ${error.message}`
    );
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.passwordChangeError,
    });
  }
};

//====================== LOGOUT USER ======================//

export const logoutUser = async (req, res) => {
  try {
    const authorizationHeader = req.headers["authorization"];
    if (!authorizationHeader) {
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.authHeaderError,
      });
    }

    const token = authorizationHeader.split(" ")[1];
    if (!token) {
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.tokenMissing,
      });
    }

    const tokenExists = await TokenModel.findOneAndDelete({ token });
    if (!tokenExists) {
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.tokenNotFound,
      });
    }

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.userLoggedOut,
    });
  } catch (error) {
    logger.error(`Error logging out user: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorLogout,
    });
  }
};

//====================== VIEW ALL USERS ======================//

export const getUsers = async (req, res) => {
  try {
    let page = req.query.page || 1;
    let limit = req.query.limit || 10;

    let offset = (page - 1) * limit;

    const users = await UserModel.find({}, { password: 0 })
      .sort({
        createdAt: 1,
      })
      .skip(offset)
      .limit(limit)
      .exec();

    const usersWithSrNo = users.map((user, index) => ({
      srNo: index + 1,
      user,
    }));

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.usersView,
      data: usersWithSrNo,
      total: await UserModel.countDocuments(),
    });
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingUsers,
    });
  }
};
