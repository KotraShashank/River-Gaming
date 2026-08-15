import Stream from "../models/streamModel.js";
import authModel from "../models/authModel.js";

const activeQuizzes = {};

// In-memory chat log per stream, capped so memory doesn't grow forever.
// Not persisted to the DB — resets on server restart, same as quizzes.
const chatHistory = {};
const MAX_CHAT_HISTORY = 50;
const MAX_MESSAGE_LENGTH = 500;

// Basic per-socket spam guard on chat messages.
const lastMessageAt = {}; // socket.id -> timestamp (ms)
const MESSAGE_COOLDOWN_MS = 1200;

const ALLOWED_REACTIONS = ["👍", "🔥", "😂", "❤️", "🎉", "😮"];

const streamSocketHandler = (io) => {
  io.on("connection", (socket) => {
    socket.on("join_stream", async ({ streamId, userId }) => {
      try {
        const stream = await Stream.findOne({ streamId });
        if (!stream) {
          return socket.emit("error", "Stream not found");
        }

        if (!stream.viewers.includes(socket.id)) {
          stream.viewers.push(socket.id);
          await stream.save();
        }

        socket.join(streamId);
        // Remember which room/user this socket belongs to so we can clean
        // up correctly on disconnect and use it for rejoin logic client-side.
        socket.data.streamId = streamId;
        socket.data.userId = userId;

        io.to(streamId).emit("viewer_count_update", {
          viewerCount: stream.viewers.length,
        });

        // Send this socket the existing chat log for the room it just joined.
        socket.emit("chat_history", chatHistory[streamId] || []);

        console.log(
          `User ${userId} joined stream ${streamId} on Socket: ${socket.id}`
        );
      } catch (err) {
        console.error("join_stream error:", err);
      }
    });

    socket.on(
      "send_message",
      ({ streamId, userId, username, role, message }) => {
        if (!streamId || typeof message !== "string" || !message.trim()) {
          return;
        }

        const now = Date.now();
        const last = lastMessageAt[socket.id] || 0;
        if (now - last < MESSAGE_COOLDOWN_MS) {
          return socket.emit("message_rate_limited", {
            message: "You're sending messages too fast — slow down a bit.",
          });
        }
        lastMessageAt[socket.id] = now;

        const chatMessage = {
          id: `${socket.id}-${now}`,
          userId: userId || null,
          username: (username || "Anonymous").slice(0, 50),
          role: role === "admin" ? "admin" : "user",
          message: message.trim().slice(0, MAX_MESSAGE_LENGTH),
          timestamp: new Date().toISOString(),
        };

        if (!chatHistory[streamId]) chatHistory[streamId] = [];
        chatHistory[streamId].push(chatMessage);
        if (chatHistory[streamId].length > MAX_CHAT_HISTORY) {
          chatHistory[streamId] = chatHistory[streamId].slice(
            -MAX_CHAT_HISTORY
          );
        }

        io.to(streamId).emit("receive_message", chatMessage);
      }
    );

    // Admin-only moderation action. Role is re-verified against the DB
    // rather than trusting whatever the client sends, since this is
    // destructive and client-supplied fields can't be trusted for auth.
    socket.on("delete_message", async ({ streamId, messageId, userId }) => {
      try {
        const user = await authModel.findById(userId);
        if (!user || user.role !== "admin") {
          return socket.emit("error", "Not authorized to delete messages");
        }

        if (chatHistory[streamId]) {
          chatHistory[streamId] = chatHistory[streamId].filter(
            (m) => m.id !== messageId
          );
        }

        io.to(streamId).emit("message_deleted", { messageId });
      } catch (err) {
        console.error("delete_message error:", err);
      }
    });

    // Typing indicator — purely ephemeral, nothing stored.
    socket.on("typing_start", ({ streamId, userId, username }) => {
      if (!streamId || !userId) return;
      socket.to(streamId).emit("user_typing", {
        userId,
        username,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ streamId, userId }) => {
      if (!streamId || !userId) return;
      socket.to(streamId).emit("user_typing", { userId, isTyping: false });
    });

    // Floating emoji reactions. Not persisted, just relayed for a moment-in-time
    // burst animation on everyone's screen.
    socket.on("send_reaction", ({ streamId, emoji }) => {
      if (!streamId || !ALLOWED_REACTIONS.includes(emoji)) return;
      io.to(streamId).emit("receive_reaction", {
        id: `${socket.id}-${Date.now()}`,
        emoji,
      });
    });

    socket.on("disconnecting", async () => {
      try {
        const rooms = Array.from(socket.rooms).filter(
          (room) => room !== socket.id
        );

        for (const room of rooms) {
          const updatedStream = await Stream.findOneAndUpdate(
            { streamId: room },
            { $pull: { viewers: socket.id } },
            { new: true }
          );

          if (updatedStream) {
            io.to(room).emit("viewer_count_update", {
              viewerCount: updatedStream.viewers.length,
            });

            console.log(
              `Socket ${socket.id} disconnected and left stream ${room}`
            );
          }
        }

        delete lastMessageAt[socket.id];
      } catch (err) {
        console.error("disconnecting error:", err);
      }
    });

    socket.on("start_quiz", ({ streamId, quiz }) => {
      console.log(`Quiz started in stream ${streamId}`, quiz);

      // Store quiz with correct index for future reference
      activeQuizzes[streamId] = quiz;

      io.to(streamId).emit("quiz_question", quiz);

      // Cleanup after 2 minutes
      setTimeout(() => {
        delete activeQuizzes[streamId];
      }, 2 * 60 * 1000);
    });

    socket.on("submit_answer", async ({ streamId, userId, answer, amount }) => {
      const quiz = activeQuizzes[streamId];
      if (!quiz) return;

      const isCorrect = answer === quiz.correctIndex;

      let coinsToUpdate = isCorrect ? amount : -amount;

      try {
        const user = await authModel.findById(userId);
        if (user) {
          const newBalance = user.coins + coinsToUpdate;
          if (newBalance < 0) {
            // Don’t allow coin deduction if user doesn’t have enough
            return socket.emit("coin_update_failed", {
              message: "Insufficient coins to bet.",
            });
          }

          user.coins = newBalance;
          await user.save();

          io.to(streamId).emit("quiz_results", {
            userId,
            answer,
            isCorrect,
            amount,
            newBalance,
          });
        }
      } catch (err) {
        console.error("Error updating coins after quiz:", err);
      }
    });
  });
};

export default streamSocketHandler;