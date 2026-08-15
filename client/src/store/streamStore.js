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
      set((state) => ({ streams: [...state.streams, res.data] }));
      return res.data;
    } catch (error) {
      throw error;
    }
  },
}));

export default useStreamStore;
