import { create } from "zustand";

type ImportFlowState = "idle" | "uploading" | "processing" | "complete" | "error";
type QueueFilter = "priority" | "score" | "needs-action";
type AnalyticsFilter = "all" | "converted" | "responded" | "contacted";

interface SdrUiState {
  selectedLeadId: string;
  queueFilter: QueueFilter;
  aiPolishing: boolean;
  importFlowState: ImportFlowState;
  importProgress: number;
  analyticsSearch: string;
  analyticsFilter: AnalyticsFilter;
  setSelectedLeadId: (leadId: string) => void;
  setQueueFilter: (filter: QueueFilter) => void;
  toggleAiPolishing: () => void;
  startImport: () => void;
  setImportProgress: (progress: number) => void;
  markImportComplete: () => void;
  markImportError: () => void;
  resetImport: () => void;
  setAnalyticsSearch: (value: string) => void;
  setAnalyticsFilter: (value: AnalyticsFilter) => void;
}

export const useSdrUiStore = create<SdrUiState>((set) => ({
  selectedLeadId: "",
  queueFilter: "priority",
  aiPolishing: true,
  importFlowState: "idle",
  importProgress: 0,
  analyticsSearch: "",
  analyticsFilter: "all",
  setSelectedLeadId: (leadId) => set({ selectedLeadId: leadId }),
  setQueueFilter: (queueFilter) => set({ queueFilter }),
  toggleAiPolishing: () => set((state) => ({ aiPolishing: !state.aiPolishing })),
  startImport: () => set({ importFlowState: "uploading", importProgress: 8 }),
  setImportProgress: (importProgress) =>
    set((state) => ({
      importFlowState: state.importFlowState === "error" ? "error" : "processing",
      importProgress,
    })),
  markImportComplete: () => set({ importFlowState: "complete", importProgress: 100 }),
  markImportError: () => set({ importFlowState: "error" }),
  resetImport: () => set({ importFlowState: "idle", importProgress: 0 }),
  setAnalyticsSearch: (analyticsSearch) => set({ analyticsSearch }),
  setAnalyticsFilter: (analyticsFilter) => set({ analyticsFilter }),
}));
