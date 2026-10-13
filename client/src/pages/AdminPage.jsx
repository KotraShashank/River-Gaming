import React, { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import {
  CircleArrowLeft,
  Copy,
  Radio,
  Search,
  Users,
  Video,
} from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AdminQuiz from "@/components/AdminQuiz";
import StreamDialog from "@/components/StreamDialog";
import DeleteStreamDialog from "@/components/DeleteStreamDialog";
import StreamChat from "@/components/StreamChat";
import LiveReactions from "@/components/LiveReactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import useStreamStore from "../store/streamStore";
import { Card } from "@/components/ui/card";
import useUserStore from "@/store/userStore";
import { toast } from "react-toastify";

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || "/";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "az", label: "Title A-Z" },
  { value: "viewers", label: "Most Viewers" },
];

const AdminPage = () => {
  const [selectedStream, setSelectedStream] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const { streams, fetchStreams } = useStreamStore();
  const userId = useUserStore((state) => state.userId);
  const name = useUserStore((state) => state.name);
  const role = useUserStore((state) => state.role);

  const { streamId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchStreams();
      setLoading(false);
    };
    load();
  }, [fetchStreams]);

  useEffect(() => {
    if (streamId && streams.length > 0) {
      const stream = streams.find((s) => s.streamId === streamId);
      if (stream) {
        setSelectedStream(stream);
      } else {
        navigate("/admin");
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

    const handleConnect = () => {
      socketClient.emit("join_stream", {
        streamId: selectedStream.streamId,
        userId,
      });
    };

    socketClient.on("connect", handleConnect);
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
      socketClient.off("connect", handleConnect);
      socketClient.disconnect();
      setSocket(null);
      setViewerCount(0);
    };
  }, [selectedStream, userId, navigate]);

  const stats = useMemo(() => {
    const totalStreams = streams.length;
    const totalViewers = streams.reduce(
      (sum, s) => sum + (s.viewerCount || 0),
      0
    );
    const liveStreams = streams.filter((s) => (s.viewerCount || 0) > 0).length;
    return { totalStreams, totalViewers, liveStreams };
  }, [streams]);

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

  const copyStreamLink = (targetStreamId, viewerFacing = true) => {
    const path = viewerFacing
      ? `/${targetStreamId}`
      : `/admin/${targetStreamId}`;
    const url = `${window.location.origin}${path}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Couldn't copy link"));
  };

  if (selectedStream) {
    return (
      <div className="p-8">
        <div className="text-sm text-muted-foreground mb-2">
          <Link to="/admin" className="hover:underline">
            Admin Panel
          </Link>{" "}
          / <span className="text-foreground">{selectedStream.title}</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <Button
            onClick={() => {
              setSelectedStream(null);
              navigate("/admin");
            }}
            className="font-semibold flex items-center gap-2"
          >
            <CircleArrowLeft />
            Go Back
          </Button>

          <div className="flex items-center gap-2">
            <StreamDialog mode="edit" stream={selectedStream} />
            <DeleteStreamDialog
              stream={selectedStream}
              trigger={
                <Button variant="destructive" className="font-semibold">
                  Delete Stream
                </Button>
              }
            />
          </div>
        </div>

        <div className="w-full flex flex-wrap justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold">{selectedStream.title}</h2>
              {viewerCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white text-xs font-semibold px-2.5 py-1">
                  <Radio className="size-3" />
                  LIVE
                </span>
              )}
            </div>
            <p className="flex items-center gap-2">
              <b>Stream ID:</b>
              <span className="font-mono text-sm">
                {selectedStream.streamId}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Users className="size-4" />
              <b>Current Viewers:</b> {viewerCount}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="font-semibold"
                onClick={() => copyStreamLink(selectedStream.streamId, true)}
              >
                <Copy className="size-4" /> Copy Viewer Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="font-semibold"
                onClick={() => copyStreamLink(selectedStream.streamId, false)}
              >
                <Copy className="size-4" /> Copy Admin Link
              </Button>
            </div>
          </div>

          <div className="flex items-end">
            <AdminQuiz streamId={selectedStream.streamId} socket={socket} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center mt-6">
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
              No video source set yet. Click the edit button above to add a
              YouTube link.
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
        <Card className="items-center py-4 gap-1">
          <Video className="size-5 text-violet-600" />
          <span className="text-2xl font-bold">{stats.totalStreams}</span>
          <span className="text-xs text-muted-foreground">
            Total Streams
          </span>
        </Card>
        <Card className="items-center py-4 gap-1">
          <Radio className="size-5 text-red-600" />
          <span className="text-2xl font-bold">{stats.liveStreams}</span>
          <span className="text-xs text-muted-foreground">
            Streams With Viewers
          </span>
        </Card>
        <Card className="items-center py-4 gap-1">
          <Users className="size-5 text-violet-600" />
          <span className="text-2xl font-bold">{stats.totalViewers}</span>
          <span className="text-xs text-muted-foreground">
            Total Viewers Now
          </span>
        </Card>
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="w-full h-[140px]" />
              <Skeleton className="h-5 w-3/4 mx-auto" />
            </div>
          ))}

        {!loading && visibleStreams.length === 0 && (
          <div className="col-span-full text-center py-12 space-y-3">
            <p className="text-muted-foreground">
              {streams.length === 0
                ? "No streams yet — create your first one to get started."
                : "No streams match your search."}
            </p>
            {streams.length === 0 && <StreamDialog />}
          </div>
        )}

        {!loading &&
          visibleStreams.map((stream) => (
            <Card
              className="p-0 overflow-hidden gap-0 cursor-pointer group relative hover:shadow-lg hover:-translate-y-0.5 transition-all"
              key={stream._id}
              onClick={() => navigate(`/admin/${stream.streamId}`)}
            >
              <div
                className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <StreamDialog mode="edit" stream={stream} />
                <DeleteStreamDialog stream={stream} />
              </div>

              {stream.viewerCount > 0 && (
                <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5">
                  <Radio className="size-3" />
                  LIVE
                </span>
              )}

              <img
                src={
                  stream.thumbnailUrl ||
                  "https://media.istockphoto.com/id/1409329028/vector/no-picture-available-placeholder-thumbnail-icon-illustration-design.jpg?s=612x612&w=0&k=20&c=_zOuJu755g2eEUioiOUdz_mHKJQJn-tDgIAhQzyeKUQ="
                }
                alt={stream.title}
                className="w-full h-[140px] object-cover rounded-sm"
              />

              <div className="flex items-center justify-between px-2">
                <div className="text-center my-2 truncate">
                  {stream.title}
                </div>
                <div className="flex items-center gap-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" />
                    {stream.viewerCount ?? 0}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Copy viewer link"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyStreamLink(stream.streamId, true);
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default AdminPage;