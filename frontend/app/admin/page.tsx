"use client";

import { useEffect, useState } from "react";
import { Activity, MessageSquare, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type AdminOverview } from "@/lib/api";

export default function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminOverview()
      .then((data) => setOverview(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="clinical-panel mb-6 overflow-hidden rounded-[28px] p-6">
        <div className="clinical-chip mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
          <ShieldCheck size={14} />
          Admin only
        </div>
        <h1 className="text-3xl font-bold">User overview</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Registered accounts and their activity. Only the emails listed in the backend `ADMIN_EMAILS` can view this page.
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : error ? (
        <Card className="clinical-panel rounded-[28px]">
          <CardContent className="p-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-red-100 text-red-700">
              <ShieldCheck size={25} />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Access denied</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              บัญชีนี้ไม่มีสิทธิ์ดูหน้า Admin หรือยังไม่ได้ตั้งค่า `ADMIN_EMAILS` ฝั่ง backend ให้ตรงกับอีเมลที่ล็อกอินอยู่
            </p>
            <p className="mt-3 text-xs text-muted-foreground">({error})</p>
          </CardContent>
        </Card>
      ) : overview ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Stat title="Total users" value={overview.total_users.toString()} icon={<Users />} />
            <Stat title="Total analyses" value={overview.total_analyses.toString()} icon={<Activity />} />
            <Stat title="Chat messages" value={overview.total_chat_messages.toString()} icon={<MessageSquare />} />
          </div>

          <Card className="clinical-panel mt-6 rounded-[28px]">
            <CardHeader>
              <CardTitle>Registered users ({overview.users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-3">Name</th>
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3">Registered</th>
                      <th className="px-3 py-3 text-right">Analyses</th>
                      <th className="px-3 py-3">Last active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.users.map((user) => (
                      <tr key={user.id} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-3 font-medium">{user.name}</td>
                        <td className="px-3 py-3 text-muted-foreground">{user.email}</td>
                        <td className="px-3 py-3 text-muted-foreground">{new Date(user.created_at).toLocaleString()}</td>
                        <td className="px-3 py-3 text-right font-semibold">{user.analysis_count}</td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {user.last_active ? new Date(user.last_active).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {overview.users.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">ยังไม่มีผู้ใช้สมัคร</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
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
