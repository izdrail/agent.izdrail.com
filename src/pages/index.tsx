import React, { useCallback, useContext, useState, useRef, useEffect } from "react";
import VrmViewer from "@/components/vrmViewer";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { Hotspot, HOTSPOTS } from "@/features/constants/hotspotData";
import { IconButton } from "@/components/iconButton";
import { Meta } from "@/components/meta";
import Link from "next/link";
import { Menu } from "@/components/menu";

export default function Home() {
  const { viewer } = useContext(ViewerContext);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("Initializing...");
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [toolsEnabled, setToolsEnabled] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [activeMode, setActiveMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const sceneRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut to toggle the tools UI (T)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyT' && !(e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement)) {
        setShowToolbar((prev: boolean) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleLoadingProgress = useCallback((progress: number, status: string) => {
    setLoadingProgress(progress);
    setLoadingStatus(status);
  }, []);

  const handleToggleTools = useCallback(() => {
    const next = !toolsEnabled;
    setToolsEnabled(next);
    viewer?.toggleTools(next);
  }, [toolsEnabled, viewer]);

  const handleSetMode = useCallback((mode: 'translate' | 'rotate' | 'scale') => {
    setActiveMode(mode);
    viewer?.setTransformMode(mode);
  }, [viewer]);

  useEffect(() => {
    if (!viewer) return;
    if (activeHotspot) {
      viewer.focusOn(
        { x: activeHotspot.worldPos.x - 2, y: activeHotspot.worldPos.y + 1, z: activeHotspot.worldPos.z + 2 },
        activeHotspot.worldPos
      );
    } else {
      viewer.resetFocus();
    }
  }, [activeHotspot, viewer]);

  useEffect(() => {
    if (isLoaded && viewer) {
      viewer.clearClickableSpheres();
      HOTSPOTS.forEach(hs => {
        viewer.addClickableSphere(hs.id, hs.worldPos, 0x4ab5b0, 0.25);
      });
      viewer.onWorldInteraction = (id: string) => {
        const hs = HOTSPOTS.find(h => h.id === id);
        if (hs) setActiveHotspot(hs);
      };
    }
  }, [isLoaded, viewer]);

  return (
    <div className="garden-container font-M_PLUS_2">
      <Meta />
      <div
        className="scene"
        ref={sceneRef}
      >
        <div className="garden-atmosphere"></div>
        <div className="depth-blur"></div>
        <div className="vignette"></div>
        {!isLoaded && (
          <div className="loading-screen animate-in fade-in duration-1000">
            <div className="loading-flower">
              <div className="petal-1"></div>
              <div className="petal-2"></div>
              <div className="petal-3"></div>
              <div className="petal-4"></div>
              <div className="petal-5"></div>
            </div>
            <div className="loading-text">Our Rainwater</div>

            {/* Progress Display */}
            <div className="progress-container">
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <div className="loading-status">
                {loadingStatus === 'Awakening...' ? 'Awakening...' : `${loadingStatus} (${loadingProgress}%)`}
              </div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 z-10 pointer-events-auto">
          <VrmViewer onLoaded={handleLoaded} onProgress={handleLoadingProgress} showCharacter={false} />
        </div>

        {/* BLENDER TOOLS — vertical toolbar, top-left */}
        {showToolbar && (
          <div style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(10, 15, 12, 0.65)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '20px',
            padding: '12px 10px',
            backdropFilter: 'blur(32px) saturate(1.8)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset',
            pointerEvents: 'auto',
          }} className="animate-in slide-in-from-left-6 duration-500">
            {/* Header label */}
            <div style={{
              fontSize: '10px',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase',
              marginBottom: '6px',
              userSelect: 'none',
            }}>
              Studio
            </div>

            {/* Power / Enable toggle */}
            <button
              onClick={handleToggleTools}
              title={toolsEnabled ? 'Disable Helpers' : 'Enable Studio Helpers'}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                border: `1.5px solid ${toolsEnabled ? 'rgba(74,181,176,1)' : 'rgba(255,255,255,0.15)'}`,
                background: toolsEnabled ? 'rgba(74,181,176,0.15)' : 'rgba(255,255,255,0.03)',
                color: toolsEnabled ? '#4ab5b0' : 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '20px',
                boxShadow: toolsEnabled ? '0 0 20px rgba(74,181,176,0.25)' : 'none',
              }}
            >
              ⏻
            </button>

            {/* Divider */}
            <div style={{
              width: '32px',
              height: '1px',
              background: 'rgba(255,255,255,0.08)',
              margin: '6px 0',
            }} />

            {/* Tool buttons */}
            {([
              { mode: 'translate', icon: '↔', label: 'Move', key: 'G' },
              { mode: 'rotate', icon: '↻', label: 'Rotate', key: 'R' },
              { mode: 'scale', icon: '⤢', label: 'Scale', key: 'S' },
            ] as const).map(({ mode, icon, label, key }) => {
              const isActive = toolsEnabled && activeMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => toolsEnabled && handleSetMode(mode)}
                  title={`${label} (${key})`}
                  style={{
                    width: '44px',
                    height: '48px',
                    borderRadius: '12px',
                    border: `1px solid ${isActive ? 'rgba(74,181,176,0.8)' : 'rgba(255,255,255,0.06)'}`,
                    background: isActive ? 'rgba(74,181,176,0.12)' : 'rgba(255,255,255,0.02)',
                    color: isActive ? '#4ab5b0' : toolsEnabled ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: toolsEnabled ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 0 12px rgba(74,181,176,0.15)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
                  <span style={{
                    fontSize: '9px',
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    opacity: isActive ? 1 : 0.5
                  }}>{key}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* TOOLTIP CARD (POP-UP ABOVE MENU) */}
        {activeHotspot && (
          <div
            className={`tip-card open`}
            style={{
              left: "50%",
              bottom: "220px",
              transform: "translateX(-50%)",
              zIndex: 1000
            }}
          >
            <div className="tip-inner">
              <div className="tip-bar" style={{ background: "rgba(74, 181, 176, 1)" }}></div>
              <div className="tip-header">
                <div className="tip-icon-wrap">{activeHotspot.icon}</div>
                <div>
                  <div className="tip-title">{activeHotspot.title}</div>
                  <div className="tip-subtitle">{activeHotspot.subtitle}</div>
                </div>
              </div>
              <div className="tip-divider"></div>
              <div className="tip-desc">{activeHotspot.desc}</div>
              <div className="tip-facts">
                {activeHotspot.facts.map((f: { label: string, value: string }, i: number) => (
                  <div key={i} className="tip-fact">
                    <div className="tip-fact-label">{f.label}</div>
                    <div className="tip-fact-value">{f.value}</div>
                  </div>
                ))}
              </div>
              <div className="tip-tags">
                {activeHotspot.tags.map((t: { text: string, color: string }, i: number) => (
                  <div
                    key={i}
                    className="tip-tag"
                    style={{ background: t.color, color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    {t.text}
                  </div>
                ))}
              </div>
              <div className="tip-footer">
                <button className="tip-close" onClick={() => setActiveHotspot(null)}>×</button>
                <Link href="/assistant-v2">
                  <button
                    className="tip-cta"
                    style={{ background: "rgba(74, 181, 176, 0.8)" }}
                  >
                    Ask Assistant
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* DISCOVERY SIDEBAR (RIGHT) */}
        <div className="side-controls">
          <IconButton
            iconName="24/Edit"
            label="Toggle Studio Studio"
            isProcessing={false}
            onClick={() => setShowToolbar(!showToolbar)}
            style={{
              background: showToolbar ? "rgba(74, 181, 176, 0.18)" : "rgba(8, 18, 8, 0.45)",
              borderColor: showToolbar ? "rgba(74, 181, 176, 0.9)" : "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(24px)",
              padding: "18px",
              marginBottom: "16px",
              borderRadius: "18px",
              boxShadow: showToolbar ? "0 0 24px rgba(74, 181, 176, 0.15)" : "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <span className="text-xl transition-transform hover:rotate-12 duration-300">🛠️</span>
          </IconButton>
          <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.12)', margin: '0 auto 16px' }}></div>
          {HOTSPOTS.map((hs) => (
            <IconButton
              key={`menu-${hs.id}`}
              iconName={"24/Dot"}
              label={hs.label}
              isProcessing={false}
              onClick={() => setActiveHotspot(hs)}
              className="group"
              style={{
                background: activeHotspot?.id === hs.id ? "rgba(74, 181, 176, 0.45)" : "rgba(8, 18, 8, 0.45)",
                borderColor: activeHotspot?.id === hs.id ? "rgba(74, 181, 176, 0.8)" : "rgba(255, 255, 255, 0.15)",
                padding: "16px",
                minWidth: "60px",
                justifyContent: "center"
              }}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{hs.icon}</span>
            </IconButton>
          ))}
        </div>

        {/* HUD (BOTTOM) */}
        <div className="bottom-controls">
          <Link href="/assistant-v2">
            <IconButton
              iconName="24/CommentFill"
              label="Garden Assistant"
              isProcessing={false}
              style={{
                background: "rgba(201, 184, 154, 0.2)",
                borderColor: "rgba(201, 184, 154, 0.3)"
              }}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}