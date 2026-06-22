"use client";

import { useState } from "react";
import { Moon, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const { darkMode, setDarkMode, resetAiMemory } = useAppStore();
  const [cleanupStatus, setCleanupStatus] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  async function handleClearMemory() {
    const confirmed = window.confirm(
      "Clear saved AI analyses, generated files, and consultant chat history for this account?"
    );
    if (!confirmed) return;

    setIsClearing(true);
    setCleanupStatus(null);

    try {
      const summary = await api.clearMemory();
      resetAiMemory();
      setCleanupStatus(
        `Cleared ${summary.cleared_analyses} analyses, ${summary.cleared_chat_messages} chat messages, ${summary.deleted_files} files, and ${summary.cleared_pending_uploads} pending uploads.`
      );
    } catch (error) {
      setCleanupStatus(error instanceof Error ? error.message : "Unable to clear AI memory right now.");
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <AppShell>
      <div className="rounded-lg border border-cyan-900/10 bg-white/82 p-5 shadow-soft dark:border-cyan-100/10 dark:bg-slate-900/82">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Tune workspace preferences and researcher profile details.</p>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="border-cyan-900/10 bg-white/84 dark:border-cyan-100/10 dark:bg-slate-900/84">
          <CardHeader><CardTitle className="flex items-center gap-2"><UserRound size={18} /> User profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Researcher name" />
            <Input placeholder="Institution" />
            <Button>Save profile</Button>
          </CardContent>
        </Card>
        <Card className="border-cyan-900/10 bg-white/84 dark:border-cyan-100/10 dark:bg-slate-900/84">
          <CardHeader><CardTitle className="flex items-center gap-2"><Moon size={18} /> Workspace</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between rounded-md border p-3 dark:bg-slate-950/50">
              <span>Dark mode</span>
              <input type="checkbox" checked={darkMode} onChange={(event) => setDarkMode(event.target.checked)} />
            </label>
            <Input placeholder="LLM API key alias" />
            <Input placeholder="Model setting: placeholder-local" />
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-white/84 dark:border-rose-400/20 dark:bg-slate-900/84">
          <CardHeader><CardTitle>AI memory cleanup</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Remove saved AI analyses, exported report data, generated images, pending uploads, and consultant chat history to keep database and storage usage under control.
            </p>
            <Button
              type="button"
              variant="outline"
              className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-400/30 dark:text-rose-200 dark:hover:bg-rose-400/10"
              onClick={handleClearMemory}
              disabled={isClearing}
            >
              {isClearing ? "Clearing..." : "Clear AI memory"}
            </Button>
            {cleanupStatus ? <p className="text-sm text-muted-foreground">{cleanupStatus}</p> : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
