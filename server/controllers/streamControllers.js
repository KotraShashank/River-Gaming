import { v4 as uuidv4 } from "uuid";
import streamModel from "../models/streamModel.js";

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
      youtubeEmbedUrl,
    });

    await newStream.save();

    res.status(201).json({
      success: true,
      message: "Stream created successfully",
      streamId,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error creating stream",
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
    const streams = await streamModel.find({}, "-viewers -__v");
    res.status(200).json({
      success: true,
      message: "All streams retrieved",
      streams,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error retrieving streams",
      error: err.message,
    });
  }
};

export { createStream, getViewerCount, getAllStreams };
