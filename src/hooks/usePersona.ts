import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Persona = "DEVELOPER" | "EXECUTIVE" | "ZEN" | "CURRENT" | "SIMPLE1" | "SIMPLE2" | "SIMPLE3";

type PersonaState = {
    persona: Persona;
    setPersona: (persona: Persona) => void;
};

export const usePersona = create<PersonaState>()(
    persist(
        (set) => ({
            persona: "SIMPLE1", // Default persona
            setPersona: (persona) => set({ persona }),
        }),
        {
            name: "persona-storage",
        }
    )
);
