"use client";

import { useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme: "outline" | "filled_blue" | "filled_black"; size: "large"; width?: string }
          ) => void;
        };
      };
    };
  }
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleSignIn() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);

  async function handleCredential(credential?: string) {
    if (!credential) return;
    const response = await api.googleLogin(credential);
    localStorage.setItem("oncovision_token", response.access_token);
    router.push("/dashboard");
  }

  function initializeGoogle() {
    if (!googleClientId || !window.google || !buttonRef.current) return;
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => handleCredential(response.credential)
    });
    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: "360"
    });
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={initializeGoogle} />
      {googleClientId ? <div ref={buttonRef} className="flex min-h-11 justify-center" /> : (
        <Button type="button" variant="outline" className="w-full" disabled>
          <Chrome size={17} />
          Continue with Google
        </Button>
      )}
      {!googleClientId ? (
        <p className="text-center text-xs text-muted-foreground">Google login needs `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.</p>
      ) : null}
    </>
  );
}
