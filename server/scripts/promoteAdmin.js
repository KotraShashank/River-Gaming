#!/usr/bin/env node
import dotenv from "dotenv";
import mongoose from "mongoose";
import authModel from "../models/authModel.js";

dotenv.config();

const MONGO = process.env.MONGO_URL;

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node server/scripts/promoteAdmin.js <email>");
    process.exit(1);
  }

  if (!MONGO) {
    console.error("MONGO_URL not set in environment (.env)");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO);
    console.log("Connected to MongoDB");

    const user = await authModel.findOne({ email: email });
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(2);
    }

    if (user.role === "admin") {
      console.log(`User ${email} is already an admin.`);
      process.exit(0);
    }

    user.role = "admin";
    await user.save();

    console.log(`Successfully promoted ${email} to admin.`);
    process.exit(0);
  } catch (err) {
    console.error("Error promoting user:", err);
    process.exit(3);
  }
}

main();
