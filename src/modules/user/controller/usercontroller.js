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

    const phoneNoExists = await UserModel.findOne({ phoneNo });
    if (phoneNoExists) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.phoneNoExists,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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
    logger.error(`Error registering user: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorRegisteringUser,
    });
  }
};

//====================== LOGIN USER ======================//

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (mongoose.connection.readyState !== 1) {
    logger.error("Database connection state:", mongoose.connection.readyState);
    return res.status(500).json({
      message: "Database is not connected. Please try again later.",
    });
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User not found.",
      });
    }

    const isMatch = await user.comparePassword(password);
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

    const isMatch = await bcrypt.compare(oldPassword, user.password);
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

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
      expires: Date.now() + 3600000,
    });

    await passwordResetToken.save();

    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset Request",
      html: `<p>Here is your OTP: <b>${otp}</b></p>`,
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
      error: error.message || error,
    });
  }
};
