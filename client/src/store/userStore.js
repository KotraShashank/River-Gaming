import { create } from "zustand";

const useUserStore = create((set) => ({
  userId: null,
  name: "",
  coins: 0,
  role: "user",

  setUserId: (id) => set({ userId: id }),
  setName: (name) => set({ name }),
  setRole: (role) => set({ role: role }),

  setCoins: (newCoins) => set({ coins: newCoins }),
  incrementCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
  deductCoins: (amount) => set((state) => ({ coins: state.coins - amount })),
}));

export default useUserStore;