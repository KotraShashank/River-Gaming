import mongoose from "mongoose";

const streamSchema = new mongoose.Schema({
  streamId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    default: "Untitled Stream",
  },
  thumbnailUrl: {
    type: String,
    default: "", // You can put a placeholder image URL here if you want
  },
  youtubeEmbedUrl: {
    type: String,
    default: "", // If empty, means no YouTube embed, use your own stream
  },
  viewers: {
    type: [String],
    default: [],
  },
});

const streamModel = mongoose.model("streams", streamSchema);
export default streamModel;
