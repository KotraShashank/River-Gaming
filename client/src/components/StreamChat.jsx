import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, ShieldUser, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

const formatTime = (isoString) => {
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const TYPING_STOP_DELAY_MS = 2000;

// A lightweight, non-persisted live chat panel scoped to one stream room.
// Reused on both the viewer-facing page and the admin page.
const StreamChat = ({ streamId, socket, userId, username, role }) => {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [typingUsers, setTypingUsers] = useState({}); // userId -> username
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const isAdmin = role === "admin";

  useEffect(() => {
    if (!socket) return;

    const handleHistory = (history) => setMessages(history || []);
    const handleMessage = (message) =>
      setMessages((prev) => [...prev, message]);
    const handleDeleted = ({ messageId }) =>
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    const handleRateLimited = (data) => {
      toast.warn(data?.message || "You're sending messages too fast.");
    };
    const handleTyping = ({ userId: typerId, username: typerName, isTyping }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (isTyping) {
          next[typerId] = typerName || "Someone";
        } else {
          delete next[typerId];
        }
        return next;
      });
    };

    socket.on("chat_history", handleHistory);
    socket.on("receive_message", handleMessage);
    socket.on("message_deleted", handleDeleted);
    socket.on("message_rate_limited", handleRateLimited);
    socket.on("user_typing", handleTyping);

    return () => {
      socket.off("chat_history", handleHistory);
      socket.off("receive_message", handleMessage);
      socket.off("message_deleted", handleDeleted);
      socket.off("message_rate_limited", handleRateLimited);
      socket.off("user_typing", handleTyping);
    };
  }, [socket]);

  useEffect(() => {
    // Auto-scroll to the newest message whenever the list changes.
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const stopTyping = () => {
    if (isTypingRef.current && socket) {
      socket.emit("typing_stop", { streamId, userId });
      isTypingRef.current = false;
    }
    clearTimeout(typingTimeoutRef.current);
  };

  const handleDraftChange = (e) => {
    setDraft(e.target.value);

    if (!socket) return;

    if (!isTypingRef.current) {
      socket.emit("typing_start", { streamId, userId, username });
      isTypingRef.current = true;
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, TYPING_STOP_DELAY_MS);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !socket) return;

    socket.emit("send_message", {
      streamId,
      userId,
      username: username || "Anonymous",
      role,
      message: trimmed,
    });

    setDraft("");
    stopTyping();
  };

  const deleteMessage = (messageId) => {
    if (!socket) return;
    socket.emit("delete_message", { streamId, messageId, userId });
  };

  useEffect(() => () => stopTyping(), []); // cleanup on unmount

  const typingNames = Object.values(typingUsers);

  return (
    <Card className="p-0 overflow-hidden gap-0 w-full max-w-md h-[500px] flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/40 shrink-0">
        <MessageCircle className="size-4" />
        <span className="font-semibold">Live Chat</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      >
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm leading-snug group/msg">
            <div className="flex items-center gap-1.5 flex-wrap">
              {msg.role === "admin" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 text-white text-[10px] font-semibold px-2 py-0.5">
                  <ShieldUser className="size-3" />
                  ADMIN
                </span>
              )}
              <span
                className={
                  msg.role === "admin"
                    ? "font-semibold text-violet-700 dark:text-violet-300"
                    : "font-semibold"
                }
              >
                {msg.username}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {formatTime(msg.timestamp)}
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => deleteMessage(msg.id)}
                  title="Delete message"
                  className="ml-auto opacity-0 group-hover/msg:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
            <p className="break-words">{msg.message}</p>
          </div>
        ))}
      </div>

      <div className="px-4 h-5 text-xs text-muted-foreground italic shrink-0">
        {typingNames.length > 0 &&
          `${typingNames.slice(0, 2).join(", ")}${
            typingNames.length > 2 ? " and others" : ""
          } typing...`}
      </div>

      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 border-t p-2 shrink-0"
      >
        <Input
          value={draft}
          onChange={handleDraftChange}
          placeholder="Send a message..."
          maxLength={500}
          disabled={!socket}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!socket || !draft.trim()}
          title="Send"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </Card>
  );
};

export default StreamChat;