import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { topic = "general", difficulty = "medium" } = await req.json();

        const prompt = `Generate a 7x7 crossword puzzle about "${topic}" with ${difficulty} difficulty.

Return a JSON object with this exact structure:
{
  "grid": [
    // 7x7 array where "#" is a black square and letters are the solution
    // Example: ["C","A","T","#","D","O","G"]
  ],
  "clues": {
    "across": [
      {"number": 1, "clue": "Feline pet", "answer": "CAT", "row": 0, "col": 0}
    ],
    "down": [
      {"number": 2, "clue": "Canine pet", "answer": "DOG", "row": 0, "col": 4}
    ]
  }
}

Rules:
- Grid must be exactly 7x7
- Use 3-6 black squares ("#") to create word boundaries
- All words must be 3-7 letters long
- Words can only go across (left-to-right) or down (top-to-bottom)
- Number the clues starting from 1, incrementing for each word start position
- Include row and col position where each word starts (0-indexed)
- Make difficulty ${difficulty}: easy=common words, medium=moderate vocabulary, hard=advanced words
- Topic should be "${topic}"
- Ensure grid is symmetric and words intersect properly

Return ONLY the JSON object, no other text.`;

        const llmResponse = await fetch(new URL("/api/llm/complete", req.url).toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") || "" },
            body: JSON.stringify({
                prompt,
                model: "gpt-4o-mini",
                provider: "openai",
            }),
        });

        if (!llmResponse.ok) {
            throw new Error("LLM generation failed");
        }

        const llmData = await llmResponse.json();
        const puzzleText = llmData.out || "";

        // Try to extract JSON from the response
        let puzzle;
        try {
            // Remove markdown code blocks if present
            const jsonMatch = puzzleText.match(/```json\n?([\s\S]*?)\n?```/) || puzzleText.match(/({[\s\S]*})/);
            const jsonText = jsonMatch ? jsonMatch[1] : puzzleText;
            puzzle = JSON.parse(jsonText.trim());
        } catch (parseError) {
            console.error("Failed to parse LLM response:", puzzleText);
            throw new Error("Failed to parse crossword puzzle from LLM response");
        }

        // Validate puzzle structure
        if (!puzzle.grid || !puzzle.clues || !puzzle.clues.across || !puzzle.clues.down) {
            throw new Error("Invalid puzzle structure");
        }

        if (puzzle.grid.length !== 7 || !puzzle.grid.every((row: any[]) => row.length === 7)) {
            throw new Error("Grid must be 7x7");
        }

        return NextResponse.json({ puzzle });
    } catch (error) {
        console.error("Crossword generation error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate crossword" },
            { status: 500 }
        );
    }
}
