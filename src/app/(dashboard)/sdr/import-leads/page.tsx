"use client";

import { ImportProcessor } from "@/features/sdr/components/sdr-primitives";
import { importSteps } from "@/features/sdr/constants/sdr-ui.mock";
import { useImportFlow } from "@/features/sdr/hooks/use-import-flow";

export default function ImportLeadsPage() {
  const {
    file,
    setFile,
    state,
    progress,
    job,
    jobLogs,
    error,
    startImport,
    reset,
    downloadTemplate,
  } = useImportFlow();

  const summary =
    job && (job.status === "completed" || job.status === "failed")
      ? `Imported ${job.importedRows} leads, ${job.duplicateRows} duplicates, ${job.invalidRows} invalid rows, ${job.errorRows} failed rows.`
      : undefined;

  return (
    <div className="pb-24 space-y-4">
      {error && (
        <div className="rounded-md border border-tertiary/40 bg-tertiary/10 px-3 py-2 text-sm text-tertiary">
          {error}
        </div>
      )}

      <ImportProcessor
        state={state}
        progress={progress}
        steps={importSteps}
        filename={file?.name}
        importSummary={summary}
        importLogs={jobLogs}
        onSelectFile={setFile}
        onDownloadTemplate={downloadTemplate}
        onGoToWorkspace={() => {
          window.location.href = "/sdr";
        }}
        onReset={reset}
      />

      <footer className="fixed bottom-0 right-0 left-0 z-30 border-t border-outline-variant/20 bg-background/85 px-4 py-3 backdrop-blur-md lg:left-64 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label-meta text-muted-foreground">
            System: {job ? `${job.status} (${job.stage})` : "Ready for file input"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-outline-variant/25 px-4 py-2 label-meta text-foreground/70"
              onClick={downloadTemplate}
            >
              Download Template
            </button>
            <button
              type="button"
              className="btn-primary-lithic rounded-lg px-6 py-2.5 label-meta shadow-[0_0_20px_rgb(163_166_255_/_0.3)]"
              onClick={startImport}
            >
              Start Bulk Import
            </button>
            <button
              type="button"
              className="rounded-lg border border-tertiary/35 px-4 py-2 label-meta text-tertiary"
              onClick={reset}
            >
              Reset
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
