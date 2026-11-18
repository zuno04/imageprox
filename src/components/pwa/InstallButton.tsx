import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallableNavigator = Navigator & { install?: () => Promise<void> };

/**
 * Install affordance following the Web Install API guidance: prefer
 * navigator.install(), fall back to the captured beforeinstallprompt event, and
 * stay hidden when the browser offers neither (hiding is the graceful path, not
 * a broken button).
 */
export function InstallButton() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(
    null
  );

  const supportsWebInstall =
    typeof window !== "undefined" &&
    typeof (window.navigator as InstallableNavigator).install === "function";

  useEffect(() => {
    if (supportsWebInstall) {
      setVisible(true);
      return;
    }

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as InstallPromptEvent);
      setVisible(true);
    };
    const handleInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      setStatus(t("pwa.installed"));
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [supportsWebInstall, t]);

  const handleInstall = async () => {
    if (busy) return;
    setBusy(true);

    try {
      const nav = window.navigator as InstallableNavigator;

      if (typeof nav.install === "function") {
        // Called directly from the click handler so user activation is intact.
        await nav.install();
        setStatus(t("pwa.installed"));
        setVisible(false);
      } else if (deferredPrompt) {
        // The event is single-use, so drop it before awaiting the user's choice.
        const promptEvent = deferredPrompt;
        setDeferredPrompt(null);
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        setStatus(outcome === "accepted" ? t("pwa.installed") : "");
        if (outcome !== "accepted") setVisible(false);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        // Cancelling is an expected choice; keep the button available.
        setStatus(t("pwa.installCancelled"));
      } else {
        setStatus(t("pwa.installFailed"));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="flex items-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-disabled={busy}
        onClick={handleInstall}
      >
        <Download size={16} className="mr-1.5" aria-hidden="true" />
        {t("pwa.install")}
      </Button>
      {/* Announced to assistive tech without adding visual noise. */}
      <span role="status" className="sr-only">
        {status}
      </span>
    </div>
  );
}
