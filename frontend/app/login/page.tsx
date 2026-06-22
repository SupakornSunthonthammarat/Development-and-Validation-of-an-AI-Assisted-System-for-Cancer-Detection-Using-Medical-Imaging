"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Activity, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GoogleSignIn } from "@/components/auth/google-sign-in";
import { useAuthToken } from "@/hooks/use-auth-token";

type LoginForm = { email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuthToken();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginForm>();

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isReady, router]);

  async function onSubmit(values: LoginForm) {
    try {
      setError(null);
      const response = await api.login(values.email, values.password);
      localStorage.setItem("oncovision_token", response.access_token);
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to login");
    }
  }

  return (
    <main className="app-gradient surface-grid grid min-h-screen place-items-center px-4">
      <Card className="animate-fade-up w-full max-w-md border-cyan-900/10 bg-white/88 shadow-glow">
        <CardHeader>
          <span className="grid h-12 w-12 place-items-center rounded-lg bg-cyan-100 text-cyan-800">
            <Activity size={22} />
          </span>
          <CardTitle>Login to AI-Assisted-System-for-Cancer-Detection-</CardTitle>
          <div className="mt-2 flex items-start gap-2 rounded-md bg-cyan-50/60 p-3 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="mt-0.5 text-cyan-700" size={15} />
            Access your research workspace. This platform is not for diagnosis or treatment decisions.
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-3">
            <GoogleSignIn />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {error ? <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
            <Input type="email" placeholder="Email" {...register("email", { required: true })} />
            <Input type="password" placeholder="Password" {...register("password", { required: true })} />
            <Button className="w-full" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            New here? <Link className="font-medium text-cyan-800" href="/register">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
