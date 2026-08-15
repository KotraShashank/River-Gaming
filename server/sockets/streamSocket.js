import Stream from "../models/streamModel.js";
import authModel from "../models/authModel.js";

const activeQuizzes = {};

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

        io.to(streamId).emit("viewer_count_update", {
          viewerCount: stream.viewers.length,
        });

        console.log(
          `User ${userId} joined stream ${streamId} on Socket: ${socket.id}`
        );
      } catch (err) {
        console.error("join_stream error:", err);
      }
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
