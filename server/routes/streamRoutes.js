import express from "express";
import {
  createStream,
  updateStream,
  deleteStream,
  getAllStreams,
  getViewerCount,
} from "../controllers/streamControllers.js";
import { adminOnly, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/stream", verifyToken, adminOnly, createStream);

router.put("/stream/:id", verifyToken, adminOnly, updateStream);

router.delete("/stream/:id", verifyToken, adminOnly, deleteStream);

router.get("/stream/:id", verifyToken, adminOnly, getViewerCount);

router.get("/stream", verifyToken, getAllStreams);

export default router;