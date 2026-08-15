import express from "express";
import { body } from "express-validator";
import { registerUser, loginUser, getInfo } from "../controllers/authControllers.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const registerValidator = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters")
    .isLength({ max: 50 })
    .withMessage("Username can be at most 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid Email Address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters"),

  body("cnfpass")
    .notEmpty()
    .withMessage("Confirm Password is required")
    .isLength({ min: 4 })
    .withMessage("Confirm Password must be at least 4 characters")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords don't match");
      }
      return true;
    }),
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid Email Address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters"),
];

const app = express.Router();

app.post("/register", registerValidator, registerUser);

app.post("/login", loginValidator, loginUser);

app.get("/", verifyToken, getInfo);

app.get("/verify", verifyToken, async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Token Valid",
    role: req.user.role,
  });
});

export default app;
