import jwt from "jsonwebtoken";
import authModel from "../models/authModel.js";

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied, no token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied, admins only",
    });
  }
  next();
};

// Socket.io handshake auth. Verifies the same JWT used by the REST API and
// stores the verified identity on socket.data. Nothing the client sends in
// later event payloads is ever used as identity.
const socketAuth = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token;
    if (typeof token !== "string" || !token) {
      return next(new Error("Authentication required"));
    }
    if (token.startsWith("Bearer ")) token = token.slice(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Display name comes from the DB (not the client); also confirms the
    // account still exists. Role comes from the verified JWT.
    const user = await authModel.findById(decoded.id).select("name");
    if (!user) return next(new Error("Authentication failed"));

    socket.data.userId = String(user._id);
    socket.data.role = decoded.role === "admin" ? "admin" : "user";
    socket.data.username = user.name;
    next();
  } catch (err) {
    next(new Error("Invalid or expired token"));
  }
};

export { verifyToken, adminOnly, socketAuth };
