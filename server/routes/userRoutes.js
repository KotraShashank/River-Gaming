import express from "express";
import { setFirst, updateCoins } from "../controllers/userControllers.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const app = express.Router();

app.put("/first", verifyToken, setFirst);

app.put("/coins", verifyToken, updateCoins);

export default app;
