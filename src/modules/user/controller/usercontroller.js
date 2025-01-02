const UserModel = require("../model/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const TokenModel = require("../model/tokenModel.js");
const nodemailer = require("nodemailer");
const PasswordResetTokenModel = require("../model/passwordResetTokenModel.js");
const { statusCode, message } = require("../../../utils/api.response.js");
const FixedDepositModel = require("../../fixed-deposit/model/fixedDeposit.js");
const { generateOtp } = require("../../../helpers/aggregation.js");
const logger = require("../../../service/logger.service.js");

//====================== REGISTER USER ======================//

const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, phoneNo, email, password } = req.body;

    const userExists = await UserModel.findOne({ email });

    if (userExists) {
      console.log("warning : ");
      logger.warn(`User with email ${email} already exists.`);
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.userExists,
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
    console.log("saving user : ");

    logger.info(`User registered successfully with email ${email}`);

    res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.userCreated,
      data: { ...savedUser.toObject(), password: undefined },
    });
  } catch (error) {
    console.error("error registering  user : ");
    logger.error(`Error registering user: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorRegisteringUser,
    });
  }
};

//====================== LOGIN USER ======================//

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      logger.warn(`Login attempt failed: User with email ${email} not found.`);
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.userNotFound,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(`Login attempt failed: Incorrect password for ${email}.`);
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.passwordIncorrect,
      });
    }

    await TokenModel.findOneAndDelete({ userId: user._id });

    const token = jwt.sign({ id: user._id }, process.env.SECRET);

    const tokenDoc = new TokenModel({ token, userId: user._id });
    await tokenDoc.save();

    logger.info(`User with email ${email} logged in successfully`);

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.userLoggedIn,
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
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorLogin,
    });
  }
};

//====================== VIEW USER ======================//

const getUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await UserModel.findById(id, { password: 0 });
    if (!user) {
      logger.warn(`User with ID ${id} not found.`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }
    logger.info(`User with ID ${id} fetched successfully.`);
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

const updateUser = async (req, res) => {
  try {
    if (req.fileValidationError) {
      logger.warn("Invalid image file uploaded.");
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: "Please upload a valid image file",
      });
    }

    if (req.fileSizeLimitError) {
      logger.warn("File size exceeds limit (1MB).");
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: "File size should be less than 1 MB.",
      });
    }

    const { firstName, lastName, phoneNo, email } = req.body;
    const profileImage = req.file ? req.file.path : null;

    const user = await UserModel.findById(req.params.id);
    if (!user) {
      logger.warn(`User with ID ${req.params.id} not found.`);
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

    logger.info(`User with ID ${req.params.id} profile updated successfully.`);

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

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (req.user.id !== userId) {
      logger.warn(
        `Unauthorized delete attempt by user ${req.user.id} on user ${userId}`
      );
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.deleteAuth,
      });
    }

    await FixedDepositModel.deleteMany({ userId });

    const deletedUser = await UserModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      logger.warn(`User with ID ${userId} not found during delete attempt.`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    logger.info(`User with ID ${userId} deleted successfully.`);
    res
      .status(statusCode.OK)
      .json({ statusCode: statusCode.OK, message: message.userDeleted });
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.deleteUserError,
      error: error.message,
    });
  }
};

//====================== CHANGE PASSWORD ======================//
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      logger.warn(
        `User with ID ${userId} not found during password change attempt.`
      );
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      logger.warn(`Incorrect old password provided by user ${userId}`);
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.incorrectOldPassword,
      });
    }

    if (newPassword !== confirmPassword) {
      logger.warn(
        `Password mismatch during password change attempt for user ${userId}`
      );
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

    logger.info(`Password changed successfully for user ${userId}`);
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

const forgotPassword = async (req, res) => {
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
      logger.warn(
        `Password reset attempt for non-existent user with email ${email}`
      );
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

    logger.info(`Password reset OTP sent to email ${email}`);
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

const resetPassword = async (req, res) => {
  try {
    const { otp } = req.body;

    const resetToken = await PasswordResetTokenModel.findOne({ token: otp });

    if (!resetToken) {
      logger.warn(`Invalid OTP provided for password reset: ${otp}`);
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.otpInvalid,
      });
    }

    if (resetToken.expires < Date.now()) {
      logger.warn(`Expired OTP provided for password reset: ${otp}`);
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: "Expired OTP",
      });
    }

    const user = await UserModel.findById(resetToken.userId);

    if (!user) {
      logger.warn(`User not found for OTP reset token: ${otp}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    logger.info(`OTP validation successful for user with ID ${user._id}`);
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

const newPassword = async (req, res) => {
  try {
    const { userId, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      logger.warn(`Password mismatch for user with ID ${userId}`);
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.passwordNotMatch,
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      logger.warn(
        `User with ID ${userId} not found during password reset attempt.`
      );
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

    logger.info(`Password successfully changed for user with ID ${userId}`);
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

const logoutUser = async (req, res) => {
  try {
    const authorizationHeader = req.headers["authorization"];
    if (!authorizationHeader) {
      logger.warn("Authorization header missing during logout attempt");
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.authHeaderError,
      });
    }

    const token = authorizationHeader.split(" ")[1];
    if (!token) {
      logger.warn(
        "Token missing in authorization header during logout attempt"
      );
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.tokenMissing,
      });
    }

    const tokenExists = await TokenModel.findOneAndDelete({ token });
    if (!tokenExists) {
      logger.warn(`Token not found for user during logout: ${token}`);
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.tokenNotFound,
      });
    }

    logger.info("User successfully logged out");
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

const getUsers = async (req, res) => {
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

    logger.info(`Fetched ${usersWithSrNo.length} users successfully`);
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
      message: message.errorFetchingUsers || "Error fetching users",
      error: error.message || error,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  changePassword,
  forgotPassword,
  resetPassword,
  newPassword,
  logoutUser,
};
