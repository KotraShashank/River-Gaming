import authModel from "../models/authModel.js";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const registerUser = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => err.msg),
    });
  }

  const { username, email, password, cnfpass } = req.body;

  if (password != cnfpass) {
    return res.status(400).json({
      success: false,
      message: "Passwords don't match",
    });
  }

  try {
    const found = await authModel.findOne({ email: email });
    if (found) {
      return res.status(400).json({
        success: false,
        message: "Email already exists, try to login",
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPass = await bcrypt.hash(password, salt);

    const newUser = new authModel({
      name: username,
      email: email,
      password: hashedPass,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "Successfully registered the new user",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error while processing your request",
      error: err,
    });
  }
};

const loginUser = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => err.msg),
    });
  }

  const { email, password } = req.body;

  try {
    const found = await authModel.findOne({ email: email });

    if (!found) {
      return res.status(404).json({
        success: false,
        message: "Invalid Credentials, please try again",
      });
    }

    const match = await bcrypt.compare(password, found.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const token = jwt.sign(
      { id: found._id, role: found.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.status(200).json({
      success: true,
      message: "User Successfully logged in",
      token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error while processing your request",
      error: err,
    });
  }
};

const getInfo = async (req, res) => {
  const id = req.user.id;

  try {
    const data = await authModel.findById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Info retrieved",
      data: {
        id: data._id,
        coins: data.coins,
        isFirst: data.isFirst,
        role: data.role,
      },
    });
  } catch (err) {
    console.error("getInfo error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

export { registerUser, loginUser, getInfo };
