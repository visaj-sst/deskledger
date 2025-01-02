import express from "express";

import {
  ensureAdmin,
  ensureAuthenticated,
} from "../../../middlewares/authValidator.js";

import {
  changePassword,
  deleteUser,
  forgotPassword,
  getUser,
  getUsers,
  loginUser,
  logoutUser,
  newPassword,
  registerUser,
  resetPassword,
  updateUser,
} from "../controller/usercontroller.js";
import {
  userLoginValidate,
  userRegisterValidate,
} from "../validation/userValidator.js";

import { upload, multerErrorHandling } from "../../../middlewares/upload.js";

const Router = express.Router();

// User Authentication Routes
Router.post("/user/login", userLoginValidate, loginUser);
Router.post("/user/logout", ensureAuthenticated, logoutUser);
Router.post("/user/register", userRegisterValidate, registerUser);

// User Profile Routes
Router.get("/user-profile/:id", ensureAuthenticated, getUser);
Router.put(
  "/user-profile/update/:id",
  ensureAuthenticated,
  upload.single("profileImage"),
  multerErrorHandling,
  updateUser
);

// User Management Routes
Router.delete("/user/delete/:id", ensureAuthenticated, deleteUser);
Router.post("/user/changepassword", ensureAuthenticated, changePassword);

// Password Recovery Routes
Router.post("/forgot-password", forgotPassword);
Router.post("/reset-password", resetPassword);
Router.post("/newpassword", newPassword);

// Admin Routes
Router.get("/users", ensureAuthenticated, ensureAdmin, getUsers);

export default Router;
