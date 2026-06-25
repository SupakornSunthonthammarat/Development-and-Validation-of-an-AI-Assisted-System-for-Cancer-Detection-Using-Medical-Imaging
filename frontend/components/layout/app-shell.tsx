"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BarChart3, ChevronRight, LogOut, MessageSquare, SearchCheck, Settings, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/chat", label: "Consultant", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const resetAiMemory = useAppStore((state) => state.resetAiMemory);

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("oncovision_token");
    }
    resetAiMemory();
    router.push("/login");
  }

  return (
    <div className="app-gradient min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[19rem] border-r border-border/70 bg-white/78 p-5 shadow-[12px_0_40px_rgba(47,58,69,0.08)] backdrop-blur-2xl dark:bg-slate-950/78 lg:block">
        <Link href="/" className="mb-8 flex items-center gap-3 rounded-2xl px-2 py-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0065A9] text-white shadow-[0_12px_28px_rgba(0,101,169,0.24)]">
            <Activity size={22} />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight">AI-Assisted-System-for-Cancer-Detection-</span>
            <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Clinical research platform</span>
          </span>
        </Link>
        <div className="clinical-panel mb-6 rounded-[22px] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#0065A9] dark:text-[#9bd7f2]">
            <SearchCheck size={16} />
            Clinical guardrails
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            AI outputs are research support artifacts. Keep diagnosis and treatment decisions within licensed clinical workflows.
          </p>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-[#edf6fb] text-[#0065A9] shadow-sm dark:bg-slate-800 dark:text-[#9bd7f2]"
                    : "text-muted-foreground hover:bg-white/70 dark:hover:bg-slate-900/70"
                )}
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                {active ? <ChevronRight size={15} /> : null}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="absolute inset-x-5 bottom-5 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
        >
          <LogOut size={18} />
          <span className="flex-1 text-left">Logout</span>
        </button>
      </aside>
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/70 bg-white/84 px-4 py-3 backdrop-blur-2xl dark:bg-slate-950/84 lg:hidden">
        <Link href="/" className="flex items-center gap-3 font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#0065A9] text-white">
            <Activity size={18} />
          </span>
          AI-Assisted-System-for-Cancer-Detection-
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          className="grid h-10 w-10 place-items-center rounded-2xl text-muted-foreground transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
        >
          <LogOut size={18} />
        </button>
      </div>
      <main className="min-h-screen px-4 pb-24 pt-5 lg:ml-[19rem] lg:px-10 lg:pb-8 lg:pt-8">
        <div className="animate-fade-up">{children}</div>
      </main>
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-[22px] border border-border/70 bg-white/92 p-1.5 shadow-[0_18px_48px_rgba(47,58,69,0.16)] backdrop-blur-2xl dark:bg-slate-950/92 lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-medium transition",
                active ? "bg-[#edf6fb] text-[#0065A9] dark:bg-slate-800 dark:text-[#9bd7f2]" : "text-muted-foreground"
              )}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
