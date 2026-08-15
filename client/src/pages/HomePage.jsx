import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { CircleArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom"; // Import hooks
import UserQuiz from "@/components/UserQuiz";
import { Button } from "@/components/ui/button";
import useStreamStore from "../store/streamStore";
import { Card } from "@/components/ui/card";
import useUserStore from "../store/userStore";
import axios from "axios";
import { toast } from "react-toastify";

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || "/";

const HomePage = () => {
  const [selectedStream, setSelectedStream] = useState(null);
  const [socket, setSocket] = useState(null);
  const { streams, fetchStreams } = useStreamStore();
  const [loading, setLoading] = useState(true);

  const { streamId } = useParams(); // Get streamId from URL
  const navigate = useNavigate(); // For navigation

  const setId = useUserStore((state) => state.setUserId);
  const setCoins = useUserStore((state) => state.setCoins);
  const userId = useUserStore((state) => state.userId);
  const setRole = useUserStore((state) => state.setRole);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      await fetchStreams();
      setLoading(false);
    };

    loadPage();
  }, [fetchStreams]);

  useEffect(() => {
    if (streamId && streams.length > 0) {
      const stream = streams.find((s) => s.streamId === streamId);
      if (stream) {
        setSelectedStream(stream);
      } else {
        navigate("/");
      }
    } else {
      setSelectedStream(null);
    }
  }, [streamId, streams, navigate]);

  useEffect(() => {
    if (!selectedStream) return;

    const socketClient = io(SOCKET_SERVER_URL);

    socketClient.on("connect", () => {
      console.log("User socket connected");
      socketClient.emit("join_stream", {
        streamId: selectedStream.streamId,
        userId,
      });
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
      setSocket(null);
    };
  }, [selectedStream, userId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("/api/auth", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { id, coins, isFirst, role } = res.data.data;

        if (isFirst) {
          await axios.put(
            "/api/user/first",
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          toast.success("🎉 Welcome! You’ve been awarded 50 bonus coins!");
        }

        setId(id);
        setCoins(coins);
        setRole(role);
      } catch (err) {
        console.error("Failed to fetch user info", err);
      }
    };

    fetchData();
    console.log(userId);
  }, [setId, setCoins]);

  if (selectedStream) {
    return (
      <div className="p-6">
        <div className="flex justify-between">
          <Button
            onClick={() => {
              setSelectedStream(null);
              navigate("/");
            }}
            className="mb-4 font-semibold flex items-center gap-2"
          >
            <CircleArrowLeft />
            Go Back
          </Button>
          <UserQuiz
            streamId={selectedStream.streamId}
            userId={userId}
            socket={socket}
          />
        </div>

        <p className="text-center text-lg font-semibold mb-4">
          {selectedStream.title}
        </p>

        {selectedStream.youtubeEmbedUrl?.length > 0 && (
          <div className="flex justify-center items-center mb-6">
            <iframe
              className="w-4/5 h-[500px]"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <p className="text-center w-full">Loading streams...</p>
        ) : streams.length === 0 ? (
          <p className="text-center w-full">No streams available</p>
        ) : (
          streams.map((stream) => (
            <Card
              key={stream._id}
              className="cursor-pointer overflow-hidden p-0 gap-0"
              onClick={() => navigate(`/${stream.streamId}`)} // Navigate to stream's unique path
            >
              <img
                src={
                  stream.thumbnailUrl || "https://via.placeholder.com/300x200"
                }
                alt={stream.title}
                className="w-full h-[200px] object-cover"
              />
              <div className="py-2 px-4 text-center text-lg">
                {stream.title}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default HomePage;
