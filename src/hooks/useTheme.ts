import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistThemeCookie, readThemeCookie, ensureDeviceId } from "@/lib/theme/cookies";

export type Theme = "blue" | "dark" | "white" | "brown" | "black" | "midnight" | "simple";

type ThemeState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

const applyTheme = (theme: Theme) => {
    if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme === "blue" ? "" : theme);
    }
};

const getInitialTheme = (): Theme => {
    if (typeof document === "undefined") return "simple";
    return (readThemeCookie() as Theme | null) ?? "simple";
};

const INITIAL_THEME = getInitialTheme();

if (typeof document !== "undefined") {
    ensureDeviceId();
    applyTheme(INITIAL_THEME);
}

export const useTheme = create<ThemeState>()(
    persist(
        (set) => ({
            theme: INITIAL_THEME,
            setTheme: (theme) => {
                set({ theme });
                applyTheme(theme);
                persistThemeCookie(theme);
            },
        }),
        {
            name: "theme-storage",
            onRehydrateStorage: () => (state) => {
                const themeToApply = (state?.theme as Theme | undefined) ?? (readThemeCookie() as Theme | undefined) ?? INITIAL_THEME;
                applyTheme(themeToApply);
            },
        }
    )
);
