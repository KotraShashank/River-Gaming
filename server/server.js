import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/connectDB.js";
import authRoutes from "./routes/authRoutes.js";
import streamRoutes from "./routes/streamRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import streamSocketHandler from "./sockets/streamSocket.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", streamRoutes);
app.use("/api/user", userRoutes);

if (process.env.NODE_ENV === "production") {
  const clientPath = path.resolve(__dirname, "../client/dist");
  app.use(express.static(clientPath));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

streamSocketHandler(io);

server.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`);
});
