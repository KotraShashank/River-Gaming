import React, { useEffect, useRef, useState } from "react";

const EMOJIS = ["👍", "🔥", "😂", "❤️", "🎉", "😮"];

// Meant to be placed as a child of a `position: relative` wrapper around
// the video player. Renders a full-cover overlay for floating emoji bursts
// plus a small button bar to send one. Purely ephemeral — nothing here is
// stored server-side.
const LiveReactions = ({ streamId, socket }) => {
  const [floaters, setFloaters] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!socket) return;

    const handleReaction = ({ emoji }) => {
      const id = idRef.current++;
      const left = 8 + Math.random() * 80; // percentage across the width
      setFloaters((prev) => [...prev, { id, emoji, left }]);
      setTimeout(() => {
        setFloaters((prev) => prev.filter((f) => f.id !== id));
      }, 2000);
    };

    socket.on("receive_reaction", handleReaction);
    return () => socket.off("receive_reaction", handleReaction);
  }, [socket]);

  const sendReaction = (emoji) => {
    if (!socket) return;
    socket.emit("send_reaction", { streamId, emoji });
  };

  return (
    <>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {floaters.map((f) => (
          <span
            key={f.id}
            className="absolute bottom-6 text-3xl animate-float-up select-none"
            style={{ left: `${f.left}%` }}
          >
            {f.emoji}
          </span>
        ))}
      </div>

      <div className="absolute bottom-2 right-2 flex gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1.5 z-10">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => sendReaction(emoji)}
            disabled={!socket}
            title={`React with ${emoji}`}
            className="text-lg leading-none hover:scale-125 transition-transform disabled:opacity-40 disabled:hover:scale-100"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
};

export default LiveReactions;