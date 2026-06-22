"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Clock, FileText, ShieldAlert, TrendingUp, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";

export default function DashboardPage() {
  const { analyses, setAnalyses } = useAppStore();

  useEffect(() => {
    api.history().then(setAnalyses).catch(() => setAnalyses([]));
  }, [setAnalyses]);

  const avgConfidence = analyses.length
    ? Math.round((analyses.reduce((sum, item) => sum + item.confidence, 0) / analyses.length) * 100)
    : 0;

  return (
    <AppShell>
      <div className="clinical-panel mb-6 overflow-hidden rounded-[28px] p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="clinical-chip mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <ShieldAlert size={14} />
              Educational research workspace
            </div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Review recent studies, track model output, and move into upload or consultant review without leaving the workspace.
            </p>
          </div>
          <Button asChild>
            <Link href="/upload">
              New analysis <ArrowRight size={17} />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Total analyses" value={analyses.length.toString()} icon={<Activity />} />
        <Stat title="Average confidence" value={`${avgConfidence}%`} icon={<TrendingUp />} />
        <Stat title="Reports" value={analyses.length.toString()} icon={<FileText />} />
      </div>

      <Card className="clinical-panel mt-6 rounded-[28px]">
        <CardHeader>
          <CardTitle>Recent analyses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analyses.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-cyan-200 bg-cyan-50/50 p-8 text-center dark:border-cyan-100/10 dark:bg-cyan-950/20">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-cyan-100 text-cyan-800">
                <UploadCloud size={25} />
              </div>
              <h2 className="mt-4 text-lg font-semibold">Start your first research analysis</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Upload an MRI, CT, X-ray, or mammogram sample to generate a simulated overlay and report.
              </p>
              <Button asChild className="mt-5">
                <Link href="/upload">Upload image</Link>
              </Button>
            </div>
          ) : (
            analyses.slice(0, 6).map((item) => (
              <Link
                href={`/results/${item.id}`}
                key={item.id}
                className="clinical-panel hover-lift flex items-center justify-between rounded-[22px] p-4 transition hover:border-cyan-300"
              >
                <div>
                  <p className="font-medium">{item.prediction}</p>
                  <p className="text-sm text-muted-foreground">{item.modality}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={15} />
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Stat({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="clinical-panel hover-lift rounded-[24px]">
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-cyan-100 text-cyan-800">{icon}</div>
      </CardContent>
    </Card>
  );
}
