const express = require("express");
const router = express.Router();
const { auth } = require("../Middlewares/auth");
const userController = require("../Controllers/userController");
const validate = require("../Middlewares/validate");
const user = require("../Validations/user");

// Route to register a new user
router.post("/register", validate(user.registerUser), userController.registerUser);

// Route to login
router.post("/login", validate(user.loginUser), userController.login);

// Route to get user profile
router.get("/me", auth(), userController.getUserProfile);

// Route to update user profile
router.put("/me", auth(), validate(user.updateUserProfile), userController.updateUserProfile);

// Route to change password
router.put("/me/password", auth(), validate(user.changePassword), userController.changePassword);

module.exports = {
  route: router,
};
