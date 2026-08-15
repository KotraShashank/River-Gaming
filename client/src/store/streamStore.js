import { create } from "zustand";
import axios from "axios";

const useStreamStore = create((set) => ({
  streams: [],
  fetchStreams: async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/admin/stream", {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ streams: res.data.streams });
    } catch (error) {
      console.error("Failed to fetch streams", error);
    }
  },
  addStream: async (streamData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/admin/stream", streamData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state) => ({
        streams: [...state.streams, res.data.stream ?? res.data],
      }));
      return res.data;
    } catch (error) {
      throw error;
    }
  },
  updateStream: async (streamId, streamData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `/api/admin/stream/${streamId}`,
        streamData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      set((state) => ({
        streams: state.streams.map((s) =>
          s.streamId === streamId ? res.data.stream : s
        ),
      }));
      return res.data;
    } catch (error) {
      throw error;
    }
  },
  deleteStream: async (streamId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/stream/${streamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set((state) => ({
        streams: state.streams.filter((s) => s.streamId !== streamId),
      }));
    } catch (error) {
      throw error;
    }
  },
}));

export default useStreamStore;