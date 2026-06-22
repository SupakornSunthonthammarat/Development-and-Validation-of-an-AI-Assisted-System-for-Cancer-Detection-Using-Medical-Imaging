"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthToken } from "@/hooks/use-auth-token";
import { ArrowRight, BrainCircuit, CheckCircle2, FileText, HeartHandshake, LineChart, ScanLine, ShieldAlert, Sparkles, Stethoscope, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { title: "Multi-modality intake", text: "Organize MRI, CT, X-ray, and mammogram studies in one research workflow.", icon: UploadCloud },
  { title: "Explainable outputs", text: "Generate plain-language summaries and report-ready notes from model predictions.", icon: FileText },
  { title: "Model-ready architecture", text: "PyTorch, MONAI, OpenCV, and YOLO interfaces are prepared for future inference.", icon: BrainCircuit }
];

export default function LandingPage() {
  const { isAuthenticated } = useAuthToken();

  return (
    <main className="app-gradient surface-grid min-h-screen overflow-hidden text-slate-950 dark:text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3 font-bold">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0065A9] text-white shadow-[0_12px_28px_rgba(0,101,169,0.24)]">
            <Stethoscope size={21} />
          </span>
          <span>
            <span className="block text-base tracking-tight">AI-Assisted-System-for-Cancer-Detection-</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground">Clinical AI platform</span>
          </span>
        </Link>
        <Button asChild size="lg">
          <Link href={isAuthenticated ? "/dashboard" : "/login"}>{isAuthenticated ? "Workspace" : "Login"}</Link>
        </Button>
      </header>

      <section className="mx-auto grid max-w-7xl gap-14 px-6 pb-14 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="animate-fade-up">
          <div className="clinical-chip mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm shadow-sm">
            <ShieldAlert size={15} />
            Research and education only
          </div>
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-6xl">
            AI-Assisted Cancer Detection from Medical Imaging
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Upload CT, MRI, PET, X-ray, or ultrasound studies for structured AI analysis, annotated findings, explainable confidence scoring, and export-ready reporting.
          </p>
          <div className="mt-7 rounded-[24px] border border-amber-200 bg-amber-50/92 p-4 text-sm font-medium text-amber-900 shadow-sm">
            This platform is designed for research, model validation, and clinician-support workflows. It is not a standalone diagnostic device.
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                {isAuthenticated ? "Open workspace" : "Start workspace"} <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">View dashboard</Link>
            </Button>
          </div>
          <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            {["Fast clinical review", "Explainable AI output", "Secure research workflow"].map((item) => (
              <div key={item} className="clinical-panel hover-lift rounded-[24px] p-4 text-sm font-medium text-cyan-950 dark:text-cyan-50">
                <CheckCircle2 className="mb-3 text-[#1A7C40]" size={16} />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="glass medical-frame animate-fade-up overflow-hidden rounded-[30px] p-5 shadow-glow [animation-delay:120ms]">
          <div className="rounded-[24px] bg-[linear-gradient(180deg,#fdfefe_0%,#eef5f8_100%)] p-5 text-[#2F3A45] dark:bg-[linear-gradient(180deg,#16202a_0%,#131c27_100%)] dark:text-white">
            <div className="mb-5 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-[#0065A9] dark:text-[#9bd7f2]">
                <Sparkles size={15} />
                Clinical dashboard preview
              </span>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-[#1A7C40] dark:text-emerald-300">Validated workflow style</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="medical-frame relative overflow-hidden rounded-[22px] border border-[#dce8ef] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9fc_100%)] p-4 dark:border-white/10 dark:bg-[linear-gradient(180deg,#182430_0%,#111b25_100%)]">
                <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  <span>Annotated scan</span>
                  <span>MRI / Lumbar spine</span>
                </div>
                <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[18px] bg-[radial-gradient(circle_at_center,rgba(77,182,231,0.18),transparent_38%),linear-gradient(135deg,#eaf4fa,#dcecf6)] dark:bg-[radial-gradient(circle_at_center,rgba(77,182,231,0.18),transparent_38%),linear-gradient(135deg,#13202b,#0d1821)]">
                  <div className="absolute inset-x-8 top-1/2 h-px bg-[#4DB6E7]/60 blur-[1px] animate-scan" />
                  <div className="relative h-44 w-44 rounded-full border border-[#4DB6E7]/30 bg-[#4DB6E7]/10 shadow-[0_0_80px_rgba(77,182,231,0.22)] animate-soft-pulse">
                    <div className="absolute inset-8 rounded-full border border-white/30 dark:border-white/20" />
                    <div className="absolute left-1/2 top-0 h-full w-px bg-white/30 dark:bg-white/10" />
                    <div className="absolute top-1/2 h-px w-full bg-white/30 dark:bg-white/10" />
                    <span className="absolute right-10 top-12 h-4 w-4 rounded-full border border-emerald-300 bg-emerald-500/80 shadow-[0_0_22px_rgba(16,185,129,0.45)]" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[22px] border border-[#dce8ef] bg-white/82 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">AI confidence</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div
                      className="metric-ring grid h-20 w-20 place-items-center rounded-full"
                      style={{ ["--progress" as string]: "78%" }}
                    >
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-sm font-bold text-[#0065A9] dark:bg-slate-900 dark:text-[#9bd7f2]">
                        78%
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Possible malignant lesion detected</p>
                      <p className="mt-1 text-sm text-muted-foreground">Explainable AI output with region localization and structured follow-up notes.</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  {[
                    "Upload -> Processing -> Detection -> Report",
                    "Supports CT, MRI, PET, X-ray, and ultrasound",
                    "Secure export-ready summary for professional review"
                  ].map((item) => (
                    <div key={item} className="rounded-[18px] border border-[#dce8ef] bg-white/76 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="clinical-panel hover-lift rounded-[24px]">
              <CardHeader>
                <Icon className="text-[#0065A9]" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.text}</CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-4 md:grid-cols-4">
        {[
          ["< 90 sec", "Average processing goal"],
          ["5 modalities", "CT, MRI, PET, X-ray, ultrasound"],
          ["Structured export", "Text summary for review"],
          ["Explainable AI", "Bounding boxes and masks"],
        ].map(([value, label]) => (
          <div key={label} className="clinical-panel rounded-[24px] p-5">
            <p className="text-3xl font-bold tracking-tight text-[#0065A9] dark:text-[#9bd7f2]">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="clinical-panel grid gap-6 rounded-[28px] p-6 md:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold"><LineChart className="text-[#0065A9]" /> Research and validation</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Built for clinician-facing readability, workflow clarity, and modular experimentation across imaging modalities and model components.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-cyan-900">
              {["Model interchangeability", "Confidence visualization", "Text export", "Professional consultant replies"].map((item) => (
                <span key={item} className="clinical-chip rounded-full px-3 py-1">{item}</span>
              ))}
            </div>
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold"><ScanLine className="text-[#1A7C40]" /> FAQ</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              The current model path is designed for research iteration. Clinical validation, regulatory review, and
              supervised deployment controls are required before any medical use.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-4">
        <div className="clinical-panel rounded-[30px] p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="clinical-chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
                <HeartHandshake size={14} />
                Credits
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">Project team</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                Built as a collaborative healthcare AI research platform with a focus on clarity, trust, and multidisciplinary teamwork.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Original visual identity and implementation adapted for this project workspace.</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { name: "Serinity Lee", initials: "SL", accent: "from-[#4DB6E7] to-[#0065A9]", photo: "/credits/serinity-lee.png" },
              { name: "Kornaphat Wongmek", initials: "KW", accent: "from-[#1A7C40] to-[#4DB6E7]", photo: "/credits/kornaphat-wongmek.png" },
              { name: "Aomboon Boonampol", initials: "AB", accent: "from-[#0065A9] to-[#1A7C40]", photo: "/credits/aomboon-boonampol.png" },
              { name: "Supakorn Sunthonthammarat", initials: "SS", accent: "from-[#4DB6E7] to-[#1A7C40]", photo: "/credits/supakorn-sunthonthammarat.png" },
            ].map((member) => (
              <CreditCard key={member.name} {...member} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function CreditCard({
  name,
  initials,
  accent,
  photo,
}: {
  name: string;
  initials: string;
  accent: string;
  photo: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="clinical-panel hover-lift rounded-[26px] p-4">
      <div className={`medical-frame mb-4 aspect-[4/5] overflow-hidden rounded-[22px] bg-gradient-to-br ${accent} shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]`}>
        {!imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="grid h-full place-items-center p-5 text-white">
            <div className="grid h-24 w-24 place-items-center rounded-full border border-white/35 bg-white/12 text-3xl font-bold tracking-tight backdrop-blur-sm">
              {initials}
            </div>
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">Healthcare AI research contributor</p>
    </div>
  );
}
