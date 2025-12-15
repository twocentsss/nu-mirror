import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "blue" | "dark" | "white" | "brown";

type ThemeState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

export const useTheme = create<ThemeState>()(
    persist(
        (set) => ({
            theme: "blue", // Default to Happy (Sky)
            setTheme: (theme) => {
                set({ theme });
                // Update document attribute
                if (typeof document !== "undefined") {
                    document.documentElement.setAttribute("data-theme", theme === "blue" ? "" : theme);
                }
            },
        }),
        {
            name: "theme-storage",
            onRehydrateStorage: () => (state) => {
                if (state?.theme && typeof document !== "undefined") {
                    document.documentElement.setAttribute("data-theme", state.theme === "blue" ? "" : state.theme);
                }
            },
        }
    )
);
