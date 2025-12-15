import type { Artifacts, ProblemBrief } from "@/core/models";
import type { StageId } from "@/ui/StageRail";

export function gatesForStage(stage: StageId, art: Artifacts | null, brief: ProblemBrief | null) {
  const missing: string[] = [];

  if (stage === "intake") {
    if (!art?.rawText?.trim()) missing.push("Raw input text");
    return { missing };
  }

  if (stage === "define") {
    if (!brief?.statement?.trim()) missing.push("Problem statement");
    if (!brief?.dod?.trim()) missing.push("Definition of Done");
    if (!brief?.timeBoundary?.trim() && art?.complexity === "HIGH") {
      missing.push("Time boundary");
    }
    if (art?.complexity === "HIGH") {
      if (!brief?.dri?.trim()) missing.push("DRI");
      if (!brief?.decider?.trim()) missing.push("Decider");
    }
    return { missing };
  }

  if (stage === "break") {
    if (!art?.issueTree) missing.push("Issue Tree");
    if (!art?.taskTree) missing.push("Task Tree");
    return { missing };
  }

  if (stage === "plan") {
    if (!art?.taskTree) missing.push("Task Tree");
    return { missing };
  }

  if (stage === "execute") {
    if (!art?.taskTree) missing.push("Task Tree");
    return { missing };
  }

  if (stage === "case") {
    if (!brief?.dod?.trim()) missing.push("DoD");
    return { missing };
  }

  if (stage === "communicate") {
    if (!art?.casePack?.bluf?.trim()) missing.push("BLUF draft");
    return { missing };
  }

  return { missing };
}
