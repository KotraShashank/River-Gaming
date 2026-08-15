import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { CircleArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom"; // Import hooks
import AdminQuiz from "@/components/AdminQuiz";
import { Button } from "@/components/ui/button";
import useStreamStore from "../store/streamStore";
import { Card } from "@/components/ui/card";
import useUserStore from "@/store/userStore";

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || "/";

const AdminPage = () => {
  const [selectedStream, setSelectedStream] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const { streams, fetchStreams } = useStreamStore();
  const userId = useUserStore((state) => state.userId);
  console.log(`User ID: ${userId}`);

  const { streamId } = useParams(); // Get streamId from URL
  const navigate = useNavigate(); // For navigation

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  useEffect(() => {
    if (streamId && streams.length > 0) {
      const stream = streams.find((s) => s.streamId === streamId);
      if (stream) {
        setSelectedStream(stream);
      } else {
        navigate("/admin"); // Redirect if stream not found
      }
    } else {
      setSelectedStream(null);
    }
  }, [streamId, streams, navigate]);

  useEffect(() => {
    if (!selectedStream) return;

    const socketClient = io(SOCKET_SERVER_URL);

    socketClient.on("connect", () => {
      console.log("Admin socket connected");
    });

    socketClient.on("viewer_count_update", ({ viewerCount }) => {
      setViewerCount(viewerCount);
    });

    setSocket(socketClient);
    socketClient.emit("join_stream", {
      streamId: selectedStream.streamId,
      userId,
    });

    return () => {
      socketClient.disconnect();
      setSocket(null);
      setViewerCount(0);
    };
  }, [selectedStream]);

  if (selectedStream) {
    return (
      <div className="p-8">
        <Button
          onClick={() => {
            setSelectedStream(null);
            navigate("/admin");
          }} // Navigate back to admin home
          className="mb-4 font-semibold flex items-center gap-2"
        >
          <CircleArrowLeft />
          Go Back
        </Button>

        <div className="w-full flex justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Stream Details</h2>
            <p>
              <b>Title:</b> {selectedStream.title}
            </p>
            <p>
              <b>Stream ID:</b> {selectedStream.streamId}
            </p>
            <p>
              <b>Current Viewers:</b> {viewerCount}
            </p>
          </div>
          <div className="flex items-end">
            <AdminQuiz streamId={selectedStream.streamId} socket={socket} />
          </div>
        </div>

        {selectedStream.youtubeEmbedUrl?.length > 0 && (
          <div className="flex justify-center items-center my-6">
            <iframe
              className="w-full md:w-[80%] h-[500px]"
              src={selectedStream.youtubeEmbedUrl}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={selectedStream.title}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8">
      <p className="text-4xl font-extrabold text-center my-6 text-violet-700 dark:text-purple-300 tracking-tight underline underline-offset-8 decoration-violet-400 dark:decoration-purple-500 decoration-4 drop-shadow-sm">
        Available Streams
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {streams.length === 0 && <p>No streams available</p>}
        {streams.map((stream) => (
          <Card
            className="p-0 overflow-hidden gap-0 cursor-pointer"
            key={stream._id}
            onClick={() => navigate(`/admin/${stream.streamId}`)} // Navigate to stream's unique path
          >
            <img
              src={
                stream.thumbnailUrl ||
                "https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=612x612&w=0&k=20&c=_zOuJu755g2eEUioiOUdz_mHKJQJn-tDgIAhQzyeKUQ="
              }
              alt={stream.title}
              className="w-full h-[140px] object-cover rounded-sm"
            />

            <div className="text-center my-2">{stream.title}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
