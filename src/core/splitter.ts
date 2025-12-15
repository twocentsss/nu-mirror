export type SplitUnit = {
  text: string;
  reason: string;
};

export function splitIntoUnits(sentences: string[], raw: string): SplitUnit[] {
  const units: SplitUnit[] = [];
  const base = sentences.length ? sentences : [raw];

  for (const sentence of base) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (/so that/i.test(trimmedSentence)) {
      units.push({ text: trimmedSentence, reason: "intent" });
      continue;
    }

    const semiParts = trimmedSentence
      .split(/;|\bthen\b/gi)
      .map((part) => part.trim())
      .filter(Boolean);

    for (const part of semiParts) {
      const andParts = part
        .split(/\band\b/gi)
        .map((sub) => sub.trim())
        .filter(Boolean);
      if (andParts.length >= 2 && looksLikeMultipleActions(andParts)) {
        andParts.forEach((p) =>
          units.push({ text: p, reason: "multi-action" }),
        );
      } else {
        units.push({
          text: part,
          reason: semiParts.length > 1 ? "then" : "sentence",
        });
      }
    }
  }

  const seen = new Set<string>();
  return units.filter((entry) => {
    const key = entry.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function looksLikeMultipleActions(parts: string[]) {
  const verbish = (text: string) => {
    const normalized = text.trim().toLowerCase();
    if (normalized.startsWith("to ")) return true;
    return /^(fix|build|write|create|deploy|schedule|send|investigate|compare|draft)\b/.test(
      normalized,
    );
  };
  return parts.filter(verbish).length >= 1;
}
