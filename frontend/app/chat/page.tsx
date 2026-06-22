"use client";

import { useEffect, useState } from "react";
import { Bot, ClipboardList, Lightbulb, Send, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

export default function ChatPage() {
  const { analyses, messages, addMessage, setAnalyses } = useAppStore();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const latestAnalysis = analyses[0];
  const quickPrompts = [
    "Summarize this result in professional language.",
    "What does the confidence score mean in practical terms?",
    "What questions should I ask a physician about this result?",
    "What follow-up steps are usually worth discussing?"
  ];

  useEffect(() => {
    if (analyses.length === 0) api.history().then(setAnalyses).catch(() => undefined);
  }, [analyses.length, setAnalyses]);

  async function send() {
    if (!draft.trim() || !latestAnalysis) return;
    const message = draft.trim();
    setDraft("");
    setError(null);
    addMessage({ role: "user", content: message });
    try {
      const response = await api.chat(message, [...messages, { role: "user", content: message }], latestAnalysis.id);
      addMessage({ role: "assistant", content: response.reply });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Consultant is unavailable");
    }
  }

  return (
    <AppShell>
      <div className="grid min-h-[calc(100vh-3rem)] gap-5 lg:grid-cols-[300px_1fr]">
        <Card className="hidden border-cyan-900/10 bg-white/82 dark:border-cyan-100/10 dark:bg-slate-900/82 lg:block">
          <CardContent className="p-5">
            <h2 className="font-semibold">Consultant guide</h2>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>Uses the latest saved analysis</p>
              <p>Answers from structured findings only</p>
              <p>Falls back to local guidance if no API key is configured</p>
            </div>
            <div className="mt-6 rounded-[22px] bg-cyan-50/60 p-4 dark:bg-cyan-950/20">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-800 dark:text-cyan-100">
                <Lightbulb size={16} />
                Try asking
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Ask about confidence, likely meaning, physician questions, follow-up, or warning signs.
              </p>
            </div>
            <div className="mt-4 rounded-[22px] border border-cyan-900/10 bg-white/70 p-4 text-sm dark:border-cyan-100/10 dark:bg-slate-950/45">
              <div className="flex items-center gap-2 font-semibold">
                <ClipboardList size={16} />
                Latest result in context
              </div>
              <p className="mt-2 text-muted-foreground">{latestAnalysis ? latestAnalysis.prediction : "No completed analysis yet."}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="clinical-panel flex flex-col rounded-[28px]">
          <CardContent className="flex flex-1 flex-col p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-100">
                <Bot size={22} />
              </span>
              <div>
                <h1 className="text-2xl font-bold">AI Consultant</h1>
                <p className="text-sm text-muted-foreground">Professional structured-findings explainer for research review.</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3 rounded-[20px] bg-amber-50 p-4 text-sm text-amber-900">
              <ShieldAlert className="mt-0.5 shrink-0" size={17} />
              <div>
                AI output is not a medical diagnosis. The consultant answers from the latest saved structured result and is intended for research support only.
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="clinical-chip rounded-full px-3 py-2 text-xs transition hover:opacity-90"
                  onClick={() => setDraft(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-[24px] border border-cyan-900/10 bg-cyan-50/45 p-4 dark:border-cyan-100/10 dark:bg-cyan-950/20">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "max-w-[82%] whitespace-pre-wrap rounded-[22px] p-4 text-sm leading-7 shadow-sm animate-fade-up",
                    message.role === "user" ? "ml-auto bg-cyan-700 text-white" : "bg-white text-slate-700 dark:bg-slate-950/75 dark:text-slate-200"
                  )}
                >
                  {message.content}
                </div>
              ))}
            </div>
            {error ? <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
            {!latestAnalysis ? (
              <div className="mt-3 rounded-md bg-cyan-50 p-3 text-sm text-cyan-900 dark:bg-cyan-950/20 dark:text-cyan-100">
                Upload and save an analysis first so the consultant has structured findings to explain.
              </div>
            ) : null}
            <div className="mt-4 flex gap-3">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask for a professional interpretation of the latest result..."
              />
              <Button size="icon" onClick={send} aria-label="Send message" disabled={!latestAnalysis}>
                <Send size={18} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
