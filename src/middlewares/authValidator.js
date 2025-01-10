//authValidator.js

import jwt from "jsonwebtoken";
import TokenModel from "../modules/user/model/tokenModel.js";
import { statusCode, message } from "../utils/api.response.js";
import UserModel from "../modules/user/model/userModel.js";
import mongoose from "mongoose";

export const ensureAuthenticated = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.error("MongoDB connection is not established. Retrying...");

      const dbConnected = await databaseConnection();
      if (!dbConnected) {
        return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
          statusCode: statusCode.INTERNAL_SERVER_ERROR,
          message: "Database not connected. Please try again later.",
        });
      }
    }

    const bearheader = req.headers["authorization"];
    if (!bearheader) {
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.expiredToken,
      });
    }

    const token = bearheader.split(" ")[1];

    const is_user = await TokenModel.findOne({ token });
    if (!is_user) {
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.tokenNotFound,
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET);
      req.user = { id: decoded.id };
      next();
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.tokenVerifyFail,
      });
    }
  } catch (error) {
    console.error("Error in ensureAuthenticated:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingUser,
    });
  }
};

export const ensureAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (!user || !user.is_admin) {
      console.error("User is not an admin or does not exist");
      return res
        .status(statusCode.FORBIDDEN)
        .json({ message: message.adminAccessRequired });
    }

    next();
  } catch (error) {
    console.error("Error in ensureAdmin:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      message: message.errorCheckingAdminStatus,
    });
  }
};
