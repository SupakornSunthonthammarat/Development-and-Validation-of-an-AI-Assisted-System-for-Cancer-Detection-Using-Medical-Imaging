"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, FileImage, ImageUp, Info, Loader2, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";

const modalities = ["MRI", "CT", "X-ray", "Mammogram"];

export default function UploadPage() {
  const { upsertAnalyses } = useAppStore();
  const [files, setFiles] = useState<File[]>([]);
  const [modality, setModality] = useState("MRI");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastBatchCount, setLastBatchCount] = useState<number>(0);
  const [completedAnalyses, setCompletedAnalyses] = useState<Array<{ id: string; prediction: string; confidence: number }>>([]);

  async function analyze() {
    if (files.length === 0) return;
    try {
      setError(null);
      setProgress(18);
      const upload = await api.uploadBatch(files, modality);
      setProgress(58);
      const results = await api.predictBatch(upload.uploads.map((item) => item.upload_id));
      upsertAnalyses(results);
      setLastBatchCount(results.length);
      setCompletedAnalyses(
        results.map((result) => ({
          id: result.id,
          prediction: result.prediction,
          confidence: result.confidence,
        }))
      );
      setProgress(100);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to analyze these images");
      setProgress(0);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div>
          <div className="clinical-panel rounded-[28px] p-6">
            <div className="clinical-chip mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <ShieldAlert size={14} />
              Not for diagnosis
            </div>
            <h1 className="text-3xl font-bold">Image Upload</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Choose a modality, upload one or many studies, and run the modular engine to produce a research-only inference package with images and text export.
            </p>
          </div>

          <Card className="clinical-panel mt-5 rounded-[28px]">
            <CardHeader>
              <CardTitle>New analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium">1. Select image type</p>
                <div className="flex flex-wrap gap-2">
                  {modalities.map((item) => (
                    <button
                      key={item}
                      onClick={() => setModality(item)}
                      className={`rounded-full border px-4 py-2 text-sm transition active:scale-[0.98] ${modality === item ? "border-cyan-300 bg-cyan-50 text-cyan-800 shadow-sm dark:bg-cyan-950/50 dark:text-cyan-100" : "bg-white hover:border-cyan-200 hover:bg-cyan-50/40 dark:bg-slate-950/45 dark:hover:bg-cyan-950/25"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">2. Upload sample set</p>
                <label
                  className="hover-lift grid min-h-72 cursor-pointer place-items-center rounded-[24px] border-2 border-dashed border-cyan-200 bg-cyan-50/45 p-8 text-center transition hover:border-cyan-400 dark:border-cyan-100/10 dark:bg-cyan-950/20"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    setFiles(Array.from(event.dataTransfer.files ?? []));
                  }}
                >
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*,.dcm"
                    multiple
                    onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                  />
                  <span>
                    <ImageUp className="mx-auto mb-3 text-cyan-700" size={38} />
                    <span className="block font-medium">
                      {files.length > 0 ? `${files.length} file(s) selected` : "Drag and drop one or more images, or browse"}
                    </span>
                    <span className="mt-2 block text-sm text-muted-foreground">PNG, JPG, JPEG, and DICOM-like files are accepted for prototyping.</span>
                  </span>
                </label>
              </div>

              {files.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border border-cyan-900/10 bg-white p-3 text-sm shadow-sm dark:border-cyan-100/10 dark:bg-slate-950/55">
                    <FileImage className="text-cyan-700" size={19} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{files.length} file(s) ready for batch processing</p>
                      <p className="text-xs text-muted-foreground">
                        {files.reduce((sum, file) => sum + Math.max(1, Math.round(file.size / 1024)), 0)} KB total
                      </p>
                    </div>
                    <Check className="text-emerald-600" size={18} />
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {files.slice(0, 6).map((file) => (
                      <div key={`${file.name}-${file.size}`} className="rounded-2xl border border-cyan-900/10 bg-white/70 px-3 py-2 text-sm dark:border-cyan-100/10 dark:bg-slate-950/45">
                        <p className="truncate font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{Math.max(1, Math.round(file.size / 1024))} KB</p>
                      </div>
                    ))}
                  </div>
                  {files.length > 6 ? <p className="text-xs text-muted-foreground">Showing 6 of {files.length} selected files.</p> : null}
                </div>
              ) : null}

              {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
              {lastBatchCount > 0 && progress === 100 ? (
                <div className="space-y-3 rounded-md bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p>
                    Batch complete. {lastBatchCount} image(s) were processed and saved successfully.
                  </p>
                  <div className="grid gap-2">
                    {completedAnalyses.map((analysis, index) => (
                      <Link
                        key={analysis.id}
                        href={`/results/${analysis.id}`}
                        className="rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 transition hover:border-emerald-400 hover:bg-white"
                      >
                        <span className="block font-medium">
                          Result {index + 1}: {analysis.prediction}
                        </span>
                        <span className="block text-xs text-emerald-800/80">
                          Confidence {Math.round(analysis.confidence * 100)}%
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                  <span>3. Run analysis</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-cyan-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={analyze} disabled={files.length === 0 || progress > 0} className="w-full md:w-auto">
                  {progress > 0 ? <Loader2 className="animate-spin" size={17} /> : null}
                  {progress > 0 ? "Processing batch..." : `Analyze ${files.length || ""} ${files.length === 1 ? "image" : "images"}`.trim()}
                </Button>
                <Button asChild variant="outline" className="w-full md:w-auto">
                  <Link href="/dashboard">View dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="clinical-panel rounded-[28px] p-5">
          <div className="flex items-center gap-2 font-semibold text-cyan-800">
            <Info size={18} />
            Review notes
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Use de-identified sample images only.</p>
            <p>The inference output is for research review and may use configured fallbacks.</p>
            <p>Batch processing will save each result as a separate completed analysis.</p>
            <p>Exported reports should support professional review, not replace it.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
