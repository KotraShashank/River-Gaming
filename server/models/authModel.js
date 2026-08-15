import mongoose from "mongoose";

const authSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      default: "user",
      enum: ["user", "admin"],
    },
    coins: {
      type: Number,
      required: true,
      default: 50,
      min: 0,
    },
    isFirst: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const authModel = mongoose.model("users", authSchema);

export default authModel;
