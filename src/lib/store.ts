import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';

const capacitorStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key: name });
    return value;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name: string): Promise<void> => {
    await Preferences.remove({ key: name });
  },
};

interface UserState {
  isAuthenticated: boolean;
  username: string;
  semester: number;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setUsername: (name: string) => void;
  setSemester: (sem: number) => void;
  login: (username: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      username: 'Fajar',
      semester: 1,
      theme: 'dark',

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        document.documentElement.classList.toggle('light', newTheme === 'light');
      },

      setUsername: (name) => set({ username: name }),
      
      setSemester: (sem) => set({ semester: sem }),

      login: (username) => set({ isAuthenticated: true, username }),

      logout: () => set({ isAuthenticated: false, username: 'Guest', semester: 1 }),
    }),
    {
      name: 'studentos-storage',
      storage: createJSONStorage(() => capacitorStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.classList.toggle('light', state.theme === 'light');
        }
      }
    }
  )
);