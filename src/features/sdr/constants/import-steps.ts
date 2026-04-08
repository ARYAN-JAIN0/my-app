import type { ImportStepItem } from "../types/sdr-ui.types";

export const importSteps: ImportStepItem[] = [
  {
    id: "ingest",
    title: "Ingest",
    description: "Reading and validating incoming rows.",
  },
  {
    id: "enrich",
    title: "Enrich",
    description: "Scoring leads and attaching context for drafting.",
  },
  {
    id: "draft",
    title: "Draft",
    description: "Generating outbound drafts and queueing approvals.",
  },
];
