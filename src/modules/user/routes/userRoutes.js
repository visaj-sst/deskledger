const userController = require("../controller/usercontroller.js");
const {
  ensureAuthenticated,
  ensureAdmin,
} = require("../../../middlewares/authValidator.js");
const {
  userLoginValidate,
  userRegisterValidate,
} = require("../validation/userValidator.js");
const {
  upload,
  multerErrorHandling,
} = require("../../../middlewares/upload.js");
const Router = require("express").Router();

// User Authentication Routes
Router.post("/user/login", userLoginValidate, userController.loginUser);
Router.post("/user/logout", ensureAuthenticated, userController.logoutUser);
Router.post(
  "/user/register",
  userRegisterValidate,
  userController.registerUser
);

// User Profile Routes
Router.get("/user-profile/:id", ensureAuthenticated, userController.getUser);
Router.put(
  "/user-profile/update/:id",
  ensureAuthenticated,
  upload.single("profileImage"),
  multerErrorHandling,
  userController.updateUser
);

// User Management Routes
Router.delete(
  "/user/delete/:id",
  ensureAuthenticated,
  userController.deleteUser
);
Router.post(
  "/user/changepassword",
  ensureAuthenticated,
  userController.changePassword
);

// Password Recovery Routes
Router.post("/forgot-password", userController.forgotPassword);
Router.post("/reset-password", userController.resetPassword);
Router.post("/newpassword", userController.newPassword);

// Admin Routes
Router.get("/users", ensureAuthenticated, ensureAdmin, userController.getUsers);

module.exports = Router;
