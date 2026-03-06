import React, { useState, useEffect } from "react";

export const PwaPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Show iOS prompt conditionally, maybe after a delay or based on user engagement
      const hasSeenPrompt = localStorage.getItem("pwaPromptDismissed");
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    // Android/Desktop detection
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const hasSeenPrompt = localStorage.getItem("pwaPromptDismissed");
      if (!hasSeenPrompt) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwaPromptDismissed", "true");
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(10, 15, 12, 0.95)",
        border: "1px solid rgba(74, 181, 176, 0.5)",
        backdropFilter: "blur(16px)",
        borderRadius: "16px",
        padding: "16px",
        zIndex: 9999,
        width: "90%",
        maxWidth: "400px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 10px rgba(74, 181, 176, 0.2)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        color: "white",
        fontFamily: "'Outfit', sans-serif",
      }}
      className="animate-in slide-in-from-bottom flex flex-col"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#4ab5b0" }}>
            Add to Home Screen
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>
            Install this app for a better, full-screen experience.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            fontSize: "20px",
            lineHeight: 1,
            padding: "4px",
          }}
        >
          ×
        </button>
      </div>

      {isIOS ? (
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px" }}>
          To install, tap the <strong>Share</strong> icon below and select <strong>&quot;Add to Home Screen&quot;</strong>.
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          style={{
            background: "#4ab5b0",
            color: "#000",
            border: "none",
            borderRadius: "8px",
            padding: "10px",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "14px",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#5bc7c2")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#4ab5b0")}
        >
          Install App
        </button>
      )}
    </div>
  );
};
