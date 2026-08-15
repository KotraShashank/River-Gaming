#!/usr/bin/env node
import dotenv from "dotenv";
import mongoose from "mongoose";
import authModel from "../models/authModel.js";

dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB\n");

    const users = await authModel.find({}, "name email role coins");
    
    if (users.length === 0) {
      console.log("No users found.");
      process.exit(0);
    }

    console.log("Users in database:");
    console.log("---");
    users.forEach(u => {
      console.log(`Name: ${u.name}\nEmail: ${u.email}\nRole: ${u.role}\nCoins: ${u.coins}\n`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();
