import { v4 as uuidv4 } from "uuid";
import Stream from "../models/streamModel.js";
import authModel from "../models/authModel.js";

// streamId -> { quizId, question, options, correctIndex, answeredBy, timeout }
const activeQuizzes = {};
const QUIZ_DURATION_MS = 2 * 60 * 1000;
const ALLOWED_BETS = [10, 50, 100];
const QUIZ_OPTION_COUNT = 4;

// In-memory chat log per stream, capped so memory doesn't grow forever.
// Not persisted to the DB — resets on server restart, same as quizzes.
const chatHistory = {};
const MAX_CHAT_HISTORY = 50;
const MAX_MESSAGE_LENGTH = 500;

// Basic per-socket spam guard on chat messages.
const lastMessageAt = {}; // socket.id -> timestamp (ms)
const MESSAGE_COOLDOWN_MS = 1200;

const ALLOWED_REACTIONS = ["👍", "🔥", "😂", "❤️", "🎉", "😮"];

const isNonEmptyString = (v) => typeof v === "string" && v.length > 0;

// Returns a clean quiz object or null if the payload is invalid.
const validateQuiz = (quiz) => {
  if (!quiz || typeof quiz !== "object") return null;
  const { question, options, correctIndex } = quiz;

  if (typeof question !== "string") return null;
  const q = question.trim();
  if (!q || q.length > 300) return null;

  if (!Array.isArray(options) || options.length !== QUIZ_OPTION_COUNT) {
    return null;
  }
  const cleanOptions = [];
  for (const opt of options) {
    if (typeof opt !== "string") return null;
    const o = opt.trim();
    if (!o || o.length > 150) return null;
    cleanOptions.push(o);
  }

  if (
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex >= QUIZ_OPTION_COUNT
  ) {
    return null;
  }

  return { question: q, options: cleanOptions, correctIndex };
};

const streamSocketHandler = (io) => {
  io.on("connection", (socket) => {
    // socket.data.userId / role / username were set by the JWT handshake
    // middleware. They are the only identity used below.

    socket.on("join_stream", async (payload) => {
      try {
        const streamId = payload?.streamId;
        if (!isNonEmptyString(streamId)) {
          return socket.emit("error", "Stream not found");
        }

        // Atomic add: safe under concurrent joins, no duplicates.
        const stream = await Stream.findOneAndUpdate(
          { streamId },
          { $addToSet: { viewers: socket.id } },
          { new: true }
        );
        if (!stream) {
          return socket.emit("error", "Stream not found");
        }

        socket.join(streamId);
        // Remember which room this socket belongs to.
        socket.data.streamId = streamId;

        io.to(streamId).emit("viewer_count_update", {
          viewerCount: stream.viewers.length,
        });

        // Send this socket the existing chat log for the room it just joined.
        socket.emit("chat_history", chatHistory[streamId] || []);

        console.log(
          `User ${socket.data.userId} joined stream ${streamId} on Socket: ${socket.id}`
        );
      } catch (err) {
        console.error("join_stream error:", err);
      }
    });

    socket.on("send_message", (payload) => {
      const streamId = payload?.streamId;
      const message = payload?.message;
      if (
        !isNonEmptyString(streamId) ||
        !socket.rooms.has(streamId) ||
        typeof message !== "string" ||
        !message.trim()
      ) {
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
        userId: socket.data.userId,
        username: (socket.data.username || "Anonymous").slice(0, 50),
        role: socket.data.role,
        message: message.trim().slice(0, MAX_MESSAGE_LENGTH),
        timestamp: new Date().toISOString(),
      };

      if (!chatHistory[streamId]) chatHistory[streamId] = [];
      chatHistory[streamId].push(chatMessage);
      if (chatHistory[streamId].length > MAX_CHAT_HISTORY) {
        chatHistory[streamId] = chatHistory[streamId].slice(-MAX_CHAT_HISTORY);
      }

      io.to(streamId).emit("receive_message", chatMessage);
    });

    // Admin-only moderation action, based on the role from the verified JWT.
    socket.on("delete_message", (payload) => {
      const streamId = payload?.streamId;
      const messageId = payload?.messageId;

      if (socket.data.role !== "admin") {
        return socket.emit("error", "Not authorized to delete messages");
      }
      if (!isNonEmptyString(streamId) || typeof messageId !== "string") {
        return;
      }

      if (chatHistory[streamId]) {
        chatHistory[streamId] = chatHistory[streamId].filter(
          (m) => m.id !== messageId
        );
      }

      io.to(streamId).emit("message_deleted", { messageId });
    });

    // Typing indicator — purely ephemeral, nothing stored.
    socket.on("typing_start", (payload) => {
      const streamId = payload?.streamId;
      if (!isNonEmptyString(streamId) || !socket.rooms.has(streamId)) return;
      socket.to(streamId).emit("user_typing", {
        userId: socket.data.userId,
        username: socket.data.username,
        isTyping: true,
      });
    });

    socket.on("typing_stop", (payload) => {
      const streamId = payload?.streamId;
      if (!isNonEmptyString(streamId) || !socket.rooms.has(streamId)) return;
      socket
        .to(streamId)
        .emit("user_typing", { userId: socket.data.userId, isTyping: false });
    });

    // Floating emoji reactions. Not persisted, just relayed for a moment-in-time
    // burst animation on everyone's screen.
    socket.on("send_reaction", (payload) => {
      const streamId = payload?.streamId;
      const emoji = payload?.emoji;
      if (
        !isNonEmptyString(streamId) ||
        !socket.rooms.has(streamId) ||
        !ALLOWED_REACTIONS.includes(emoji)
      ) {
        return;
      }
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

    socket.on("start_quiz", async (payload) => {
      try {
        if (socket.data.role !== "admin") {
          return socket.emit("error", "Not authorized to start a quiz");
        }

        const streamId = payload?.streamId;
        if (!isNonEmptyString(streamId)) {
          return socket.emit("error", "Stream not found");
        }

        const quiz = validateQuiz(payload?.quiz);
        if (!quiz) {
          return socket.emit("error", "Invalid quiz data");
        }

        const stream = await Stream.exists({ streamId });
        if (!stream) {
          return socket.emit("error", "Stream not found");
        }

        // Replacing a running quiz: cancel the old one's timer.
        const previous = activeQuizzes[streamId];
        if (previous) clearTimeout(previous.timeout);

        const quizId = uuidv4();
        // The timer only removes the quiz instance it was created for, so a
        // stale timer can never delete a newer quiz on the same stream.
        const timeout = setTimeout(() => {
          if (activeQuizzes[streamId]?.quizId === quizId) {
            delete activeQuizzes[streamId];
          }
        }, QUIZ_DURATION_MS);

        activeQuizzes[streamId] = {
          quizId,
          ...quiz,
          answeredBy: new Set(),
          timeout,
        };

        console.log(`Quiz ${quizId} started in stream ${streamId}`);

        // Never send correctIndex to clients: it's only used server-side.
        io.to(streamId).emit("quiz_question", {
          question: quiz.question,
          options: quiz.options,
        });
      } catch (err) {
        console.error("start_quiz error:", err);
      }
    });

    socket.on("submit_answer", async (payload) => {
      const fail = (message) => socket.emit("coin_update_failed", { message });

      const streamId = payload?.streamId;
      const answer = payload?.answer;
      const amount = payload?.amount;
      const userId = socket.data.userId; // verified identity, not the payload

      if (!isNonEmptyString(streamId) || !socket.rooms.has(streamId)) {
        return fail("Join the stream before answering.");
      }

      const quiz = activeQuizzes[streamId];
      if (!quiz) return fail("No active quiz.");

      if (!ALLOWED_BETS.includes(amount)) {
        return fail("Invalid bet amount.");
      }
      if (
        !Number.isInteger(answer) ||
        answer < 0 ||
        answer >= quiz.options.length
      ) {
        return fail("Invalid answer.");
      }

      // One answer per user per quiz. Reserved synchronously (before any
      // await) so concurrent duplicate submissions can't both get through.
      if (quiz.answeredBy.has(userId)) {
        return fail("You have already answered this quiz.");
      }
      quiz.answeredBy.add(userId);

      const isCorrect = answer === quiz.correctIndex;

      try {
        // Atomic: balance check and update are a single DB operation, so
        // concurrent requests can't corrupt the balance or push it below 0.
        const user = await authModel.findOneAndUpdate(
          { _id: userId, coins: { $gte: amount } },
          { $inc: { coins: isCorrect ? amount : -amount } },
          { new: true }
        );

        if (!user) {
          // Nothing was changed, so don't burn the user's one attempt.
          quiz.answeredBy.delete(userId);
          return fail("Insufficient coins to bet.");
        }

        // The balance goes only to the person who answered. Admins in the
        // stream get the result without anyone's balance; other viewers
        // get nothing about other people's answers.
        const result = { userId, answer, isCorrect, amount };
        socket.emit("quiz_results", { ...result, newBalance: user.coins });
        const peers = await io.in(streamId).fetchSockets();
        for (const peer of peers) {
          if (peer.id !== socket.id && peer.data.role === "admin") {
            peer.emit("quiz_results", result);
          }
        }
      } catch (err) {
        quiz.answeredBy.delete(userId);
        console.error("Error updating coins after quiz:", err);
      }
    });
  });
};

export default streamSocketHandler;
