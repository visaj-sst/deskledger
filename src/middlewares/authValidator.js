//authValidator.js

import jwt from "jsonwebtoken";
import TokenModel from "../modules/user/model/tokenModel.js";
import { statusCode, message } from "../utils/api.response.js";
import UserModel from "../modules/user/model/userModel.js";

export const ensureAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token)
      return res
        .status(statusCode.UNAUTHORIZED)
        .json({ message: message.expiredToken });

    const isUser = await TokenModel.findOne({ token });
    if (!isUser)
      return res
        .status(statusCode.UNAUTHORIZED)
        .json({ message: message.tokenNotFound });

    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err)
        return res
          .status(statusCode.UNAUTHORIZED)
          .json({ message: message.tokenVerifyFail });
      req.user = { id: decoded.id };
      next();
    });
  } catch (error) {
    console.error("Error in ensureAuthenticated:", error);
    return res
      .status(statusCode.INTERNAL_SERVER_ERROR)
      .json({ message: message.INTERNAL_SERVER_ERROR });
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
