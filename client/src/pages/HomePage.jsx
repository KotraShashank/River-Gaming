import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { CircleArrowLeft, Radio, Search, Users } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import UserQuiz from "@/components/UserQuiz";
import StreamChat from "@/components/StreamChat";
import LiveReactions from "@/components/LiveReactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import useStreamStore from "../store/streamStore";
import { Card } from "@/components/ui/card";
import useUserStore from "../store/userStore";

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || "/";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "az", label: "Title A-Z" },
  { value: "viewers", label: "Most Viewers" },
];

const HomePage = () => {
  const [selectedStream, setSelectedStream] = useState(null);
  const [socket, setSocket] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const { streams, fetchStreams } = useStreamStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const { streamId } = useParams();
  const navigate = useNavigate();

  const userId = useUserStore((state) => state.userId);
  const name = useUserStore((state) => state.name);
  const role = useUserStore((state) => state.role);

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

    const socketClient = io(SOCKET_SERVER_URL, {
      auth: (cb) => cb({ token: localStorage.getItem("token") }),
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketClient.on("connect", () => {
      socketClient.emit("join_stream", {
        streamId: selectedStream.streamId,
        userId,
      });
    });

    socketClient.on("viewer_count_update", ({ viewerCount }) => {
      setViewerCount(viewerCount);
    });

    socketClient.on("connect_error", (err) => {
      if (/token|authentication/i.test(err.message)) {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      }
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
      setSocket(null);
      setViewerCount(0);
    };
  }, [selectedStream, userId, navigate]);

  const visibleStreams = useMemo(() => {
    let list = streams;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => s.title?.toLowerCase().includes(q));
    }

    list = [...list];
    if (sortBy === "az") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "viewers") {
      list.sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0));
    } else {
      list.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    }

    return list;
  }, [streams, search, sortBy]);

  if (selectedStream) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <Button
            onClick={() => {
              setSelectedStream(null);
              navigate("/");
            }}
            className="font-semibold flex items-center gap-2"
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

        <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
          <p className="text-center text-lg font-semibold">
            {selectedStream.title}
          </p>
          {viewerCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white text-xs font-semibold px-2.5 py-1">
              <Radio className="size-3" />
              LIVE
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="size-4" />
            {viewerCount} watching
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          {selectedStream.youtubeEmbedUrl?.length > 0 ? (
            <div className="relative flex-1 w-full max-w-4xl">
              <iframe
                className="w-full h-[500px]"
                src={selectedStream.youtubeEmbedUrl}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={selectedStream.title}
              />
              <LiveReactions streamId={selectedStream.streamId} socket={socket} />
            </div>
          ) : (
            <div className="flex-1 w-full max-w-4xl h-[500px] flex items-center justify-center border rounded-md text-muted-foreground">
              This stream doesn't have a video source yet. Check back soon!
            </div>
          )}

          <StreamChat
            streamId={selectedStream.streamId}
            socket={socket}
            userId={userId}
            username={name}
            role={role}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <p className="text-4xl font-extrabold text-center my-6 text-violet-700 dark:text-purple-300 tracking-tight underline underline-offset-8 decoration-violet-400 dark:decoration-purple-500 decoration-4 drop-shadow-sm">
        Available Streams
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search streams by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border bg-background rounded-md h-9 px-3 text-sm shadow-xs"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="w-full h-[200px]" />
              <Skeleton className="h-5 w-3/4 mx-auto" />
            </div>
          ))}

        {!loading && visibleStreams.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-12">
            {streams.length === 0
              ? "No streams available right now. Check back soon!"
              : "No streams match your search."}
          </p>
        )}

        {!loading &&
          visibleStreams.map((stream) => (
            <Card
              key={stream._id}
              className="cursor-pointer overflow-hidden p-0 gap-0 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              onClick={() => navigate(`/${stream.streamId}`)}
            >
              <div className="relative">
                <img
                  src={
                    stream.thumbnailUrl ||
                    "https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=612x612&w=0&k=20&c=_zOuJu755g2eEUioiOUdz_mHKJQJn-tDgIAhQzyeKUQ="
                  }
                  alt={stream.title}
                  className="w-full h-[200px] object-cover"
                />
                {stream.viewerCount > 0 && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5">
                    <Radio className="size-3" />
                    LIVE
                  </span>
                )}
                <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/70 text-white text-[10px] font-medium px-2 py-0.5">
                  <Users className="size-3" />
                  {stream.viewerCount ?? 0}
                </span>
              </div>
              <div className="py-2 px-4 text-center text-lg truncate">
                {stream.title}
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default HomePage;