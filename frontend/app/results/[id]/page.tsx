"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Download, Info, ScanLine, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assetUrl, downloadReport } from "@/lib/assets";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const { analyses, setAnalyses } = useAppStore();
  const analysis = useMemo(() => analyses.find((item) => item.id === params.id), [analyses, params.id]);

  useEffect(() => {
    if (analysis) return;
    api.history().then(setAnalyses).catch(() => undefined);
  }, [analysis, setAnalyses]);

  return (
    <AppShell>
      <div className="clinical-panel mb-6 rounded-[28px] p-6">
        <div className="clinical-chip mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
          <ShieldAlert size={14} />
          Research inference
        </div>
        <h1 className="text-3xl font-bold">Results</h1>
        <p className="mt-1 text-muted-foreground">Review the visual artifacts, model notes, and exportable text summary from the completed inference run.</p>
      </div>

      {!analysis ? (
        <Card className="border-cyan-900/10 bg-white/82 dark:border-cyan-100/10 dark:bg-slate-900/82"><CardContent className="p-8 text-muted-foreground">Loading analysis...</CardContent></Card>
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="grid gap-5 md:grid-cols-2">
              <ImagePanel title="Original image" src={analysis.image_url} />
              <ImagePanel title="Overlay image" src={analysis.overlay_url} />
              <ImagePanel title="Annotated image" src={analysis.annotated_image_url} />
              {analysis.segmentation_mask_urls[0] ? (
                <ImagePanel title="Segmentation mask" src={analysis.segmentation_mask_urls[0]} />
              ) : (
                <Placeholder title="Segmentation mask unavailable" icon={<ScanLine />} />
              )}
            </div>
            <Card className="clinical-panel rounded-[28px]">
              <CardHeader>
                <CardTitle>Finding summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-sm text-muted-foreground">Possible finding</p>
                  <p className="mt-1 text-xl font-semibold">{analysis.prediction}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confidence score</p>
                  <p className="mt-1 text-4xl font-bold text-cyan-800">{Math.round(analysis.confidence * 100)}%</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-cyan-600 transition-all duration-700" style={{ width: `${Math.round(analysis.confidence * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Detected regions</p>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{analysis.bounding_boxes.length} bounding box(es) returned</p>
                </div>
                <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                  Not a diagnosis. Confirm all AI findings with validated clinical workflows and licensed specialists.
                </div>
                <div className="flex gap-3 rounded-lg bg-cyan-50/60 p-3 text-sm leading-6 text-muted-foreground">
                  <Info className="mt-0.5 shrink-0 text-cyan-700" size={17} />
                  The inference engine is modular. Classifier, detector, and segmenter can be swapped independently.
                </div>
                <Button className="w-full" onClick={() => downloadReport(analysis.id)}>
                  <Download size={17} /> Export result (.txt)
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="clinical-panel rounded-[28px]">
            <CardHeader>
              <CardTitle>Inference details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Section
                  title="Pipeline explanation"
                  items={[analysis.explanation]}
                />
                <Section
                  title="Engine components"
                  items={[
                    `Classifier: ${analysis.engine.classifier ?? "unknown"}`,
                    `Detector: ${analysis.engine.detector ?? "unknown"}`,
                    `Segmenter: ${analysis.engine.segmenter ?? "unknown"}`
                  ]}
                />
                <Section
                  title="Bounding boxes"
                  items={analysis.bounding_boxes.length > 0 ? analysis.bounding_boxes.map(formatBoundingBox) : ["No bounding boxes were produced."]}
                />
                <Section
                  title="Segmentation masks"
                  items={[
                    `${analysis.segmentation_mask_urls.length} mask file(s) generated`,
                    "Masks are research artifacts and not clinical contours."
                  ]}
                />
                <Section
                  title="Follow-up"
                  items={[
                    "Review annotated regions and masks alongside the original image.",
                    "Validate any production model with approved datasets and clinician review."
                  ]}
                />
                <div className="rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  AI output is not a medical diagnosis. This modular engine is for research, experimentation, and integration work only.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-cyan-900/10 bg-cyan-50/35 p-4 dark:border-cyan-100/10 dark:bg-cyan-950/20">
      <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function formatBoundingBox(box: {
  label: string;
  confidence: number;
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}) {
  return `${box.label} (${Math.round(box.confidence * 100)}%) [${box.x_min}, ${box.y_min}] to [${box.x_max}, ${box.y_max}]`;
}

function ImagePanel({ title, src }: { title: string; src: string }) {
  return (
    <Card className="clinical-panel hover-lift rounded-[24px]">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetUrl(src)} alt={title} className="aspect-square w-full rounded-lg object-cover shadow-sm" />
      </CardContent>
    </Card>
  );
}

function Placeholder({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <Card className="clinical-panel hover-lift rounded-[24px]">
      <CardContent className="grid aspect-square place-items-center p-6 text-center">
        <div className="text-cyan-800">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-lg bg-cyan-100">{icon}</div>
          <p className="font-medium">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
