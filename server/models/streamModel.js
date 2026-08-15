import mongoose from "mongoose";

const streamSchema = new mongoose.Schema(
  {
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
      default: "",
    },
    youtubeEmbedUrl: {
      type: String,
      default: "",
    },
    viewers: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const streamModel = mongoose.model("streams", streamSchema);
export default streamModel;