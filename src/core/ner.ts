import nlp from "compromise";
import dates from "compromise-dates";

nlp.extend(dates);

export type NerMode = "fast" | "ml";

export type NerEntityType =
  | "PERSON"
  | "ORG"
  | "GPE"
  | "DATE"
  | "TIME"
  | "MONEY"
  | "URL"
  | "EMAIL"
  | "MISC";

export type NerEntity = {
  text: string;
  type: NerEntityType;
  start?: number;
  end?: number;
  confidence?: number;
};

export type NlpAnalysis = {
  sentences: string[];
  tokens: { token: string; tags: string[] }[];
  entities: NerEntity[];
  primaryDateText?: string;
  normalizedDateISO?: string;
  verbs: string[];
  nouns: string[];
};

function fastAnalyze(text: string): NlpAnalysis {
  const doc = nlp(text) as any;
  const sentences = doc.sentences().out("array") as string[];
  const terms = doc.terms().json() as any[];
  const tokens = terms.map((t) => ({
    token: t.text,
    tags: Array.isArray(t.tags)
      ? t.tags
      : Object.keys(t.terms?.[0]?.tags ?? t.tags ?? {}),
  }));

  const people = (doc.people().out("array") as string[]).map((x) => ({
    text: x,
    type: "PERSON" as const,
  }));
  const orgs = (doc.organizations().out("array") as string[]).map((x) => ({
    text: x,
    type: "ORG" as const,
  }));
  const places = (doc.places().out("array") as string[]).map((x) => ({
    text: x,
    type: "GPE" as const,
  }));

  const djson = doc.dates().json() as any[];
  const primaryDateText = djson?.[0]?.text;
  const normalizedDateISO =
    djson?.[0]?.date?.start !== undefined
      ? new Date(djson[0].date.start).toISOString()
      : undefined;
  const dateEntities = djson.map((d) => ({
    text: d.text,
    type: "DATE" as const,
  }));

  const verbs = doc.verbs().toInfinitive().out("array") as string[];
  const nouns = doc.nouns().out("array") as string[];

  const urlRe = /\bhttps?:\/\/\S+\b/gi;
  const emailRe = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

  const urls = (text.match(urlRe) ?? []).map((x) => ({
    text: x,
    type: "URL" as const,
  }));
  const emails = (text.match(emailRe) ?? []).map((x) => ({
    text: x,
    type: "EMAIL" as const,
  }));

  return {
    sentences,
    tokens,
    entities: [...people, ...orgs, ...places, ...dateEntities, ...urls, ...emails],
    primaryDateText,
    normalizedDateISO,
    verbs,
    nouns,
  };
}

let mlPipelinePromise: Promise<any> | null = null;

async function getMlPipeline() {
  if (!mlPipelinePromise) {
    mlPipelinePromise = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      return pipeline("token-classification", "Xenova/bert-base-NER", {
        quantized: true,
      });
    })();
  }
  return mlPipelinePromise;
}

async function mlAnalyze(text: string): Promise<NlpAnalysis> {
  const fast = fastAnalyze(text);
  const ner = await getMlPipeline();
  const out = await ner(text, { aggregation_strategy: "simple" });
  const mlEntities = (out ?? []).map((entry: any) => {
    const group = String(entry.entity_group || entry.entity || "").toUpperCase();
    const type: NerEntityType =
      group === "PER"
        ? "PERSON"
        : group === "ORG"
          ? "ORG"
          : group === "LOC"
            ? "GPE"
            : group === "MISC"
              ? "MISC"
              : "MISC";
    return {
      text: entry.word,
      type,
      start: entry.start,
      end: entry.end,
      confidence: entry.score,
    } as NerEntity;
  });

  const seen = new Set<string>();
  const merged = [...mlEntities, ...fast.entities].filter((entity) => {
    const key = `${entity.type}:${entity.text.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { ...fast, entities: merged };
}

export async function analyzeNlp(text: string, mode: NerMode): Promise<NlpAnalysis> {
  const cleaned = text.trim();
  if (!cleaned) {
    return {
      sentences: [],
      tokens: [],
      entities: [],
      verbs: [],
      nouns: [],
    };
  }
  if (mode === "ml") {
    return mlAnalyze(cleaned);
  }
  return Promise.resolve(fastAnalyze(cleaned));
}
