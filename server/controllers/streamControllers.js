import { v4 as uuidv4 } from "uuid";
import streamModel from "../models/streamModel.js";

// Accepts watch URLs, short youtu.be URLs, or already-correct embed URLs
// and always returns a proper https://www.youtube.com/embed/VIDEO_ID link.
const normalizeYoutubeUrl = (url) => {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return url; // already an embed URL
      }
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (parsed.pathname.startsWith("/live/")) {
        const id = parsed.pathname.split("/live/")[1];
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
    }

    return url; // not a recognized YouTube URL shape, leave as-is
  } catch {
    return url; // not a valid URL at all, leave validation to the schema
  }
};

const createStream = async (req, res) => {
  try {
    const streamId = uuidv4();

    const {
      title = "Untitled Stream",
      thumbnailUrl = "",
      youtubeEmbedUrl = "",
    } = req.body;

    const newStream = new streamModel({
      streamId,
      title,
      thumbnailUrl,
      youtubeEmbedUrl: normalizeYoutubeUrl(youtubeEmbedUrl),
    });

    await newStream.save();

    res.status(201).json({
      success: true,
      message: "Stream created successfully",
      streamId,
      stream: newStream,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error creating stream",
      error: err.message,
    });
  }
};

const updateStream = async (req, res) => {
  const streamId = req.params.id;

  try {
    const { title, thumbnailUrl, youtubeEmbedUrl } = req.body;

    const update = {};
    if (title !== undefined) update.title = title;
    if (thumbnailUrl !== undefined) update.thumbnailUrl = thumbnailUrl;
    if (youtubeEmbedUrl !== undefined)
      update.youtubeEmbedUrl = normalizeYoutubeUrl(youtubeEmbedUrl);

    const updatedStream = await streamModel.findOneAndUpdate(
      { streamId },
      update,
      { new: true, runValidators: true }
    );

    if (!updatedStream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stream updated successfully",
      stream: updatedStream,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error updating stream",
      error: err.message,
    });
  }
};

const deleteStream = async (req, res) => {
  const streamId = req.params.id;

  try {
    const deletedStream = await streamModel.findOneAndDelete({ streamId });

    if (!deletedStream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stream deleted successfully",
      streamId,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error deleting stream",
      error: err.message,
    });
  }
};

const getViewerCount = async (req, res) => {
  const streamId = req.params.id;
  try {
    const stream = await streamModel.findOne({ streamId });
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: "Stream not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stream found",
      viewerCount: stream.viewers.length,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error finding stream",
      error: err.message,
    });
  }
};

const getAllStreams = async (req, res) => {
  try {
    const streams = await streamModel.find({}, "-__v").sort({ createdAt: -1 });

    // Expose a safe viewer *count* to the client instead of the raw
    // socket-id array (those are internal implementation detail).
    const shaped = streams.map((s) => ({
      _id: s._id,
      streamId: s.streamId,
      title: s.title,
      thumbnailUrl: s.thumbnailUrl,
      youtubeEmbedUrl: s.youtubeEmbedUrl,
      viewerCount: s.viewers.length,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    res.status(200).json({
      success: true,
      message: "All streams retrieved",
      streams: shaped,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error retrieving streams",
      error: err.message,
    });
  }
};

export {
  createStream,
  updateStream,
  deleteStream,
  getViewerCount,
  getAllStreams,
};