import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Persona = "DEVELOPER" | "EXECUTIVE" | "ZEN" | "CURRENT" | "CREATIVE" | "CORP" | "SIMPLE1" | "SIMPLE2" | "SIMPLE3";

type PersonaState = {
    persona: Persona;
    setPersona: (persona: Persona) => void;
};

export const usePersona = create<PersonaState>()(
    persist(
        (set) => ({
            persona: "EXECUTIVE", // Default persona
            setPersona: (persona) => set({ persona }),
        }),
        {
            name: "persona-storage",
        }
    )
);
