import { useCallback, useContext, useEffect, useState, useRef } from "react";
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
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [toolsEnabled, setToolsEnabled] = useState(false);
  const [activeMode, setActiveMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const sceneRef = useRef<HTMLDivElement>(null);

  const handleLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Ensure tools are hidden by default once the viewer is ready
  useEffect(() => {
    if (viewer?.isReady) {
      viewer.toggleTools(false);
    }
  }, [viewer, viewer?.isReady]);

  const handleToggleTools = useCallback(() => {
    const next = !toolsEnabled;
    setToolsEnabled(next);
    viewer?.toggleTools(next);
  }, [toolsEnabled, viewer]);

  const handleSetMode = useCallback((mode: 'translate' | 'rotate' | 'scale') => {
    setActiveMode(mode);
    viewer?.setTransformMode(mode);
  }, [viewer]);

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
            <div className="loading-status italic">Preparing the Sanctuary...</div>
          </div>
        )}
        <div className="absolute inset-0 z-10 pointer-events-auto">
          <VrmViewer onLoaded={handleLoaded} showCharacter={false} />
        </div>

        {/* BLENDER TOOLS — vertical toolbar, top-left */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(10, 10, 12, 0.72)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '8px 6px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          pointerEvents: 'auto',
        }}>
          {/* Header label */}
          <div style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
            marginBottom: '4px',
            userSelect: 'none',
          }}>
            3D
          </div>

          {/* Power / Enable toggle */}
          <button
            onClick={handleToggleTools}
            title={toolsEnabled ? 'Disable 3D Tools' : 'Enable 3D Tools'}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: `1px solid ${toolsEnabled ? 'rgba(74,181,176,0.8)' : 'rgba(255,255,255,0.12)'}`,
              background: toolsEnabled ? 'rgba(74,181,176,0.25)' : 'rgba(255,255,255,0.05)',
              color: toolsEnabled ? '#4ab5b0' : 'rgba(255,255,255,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '18px',
              boxShadow: toolsEnabled ? '0 0 12px rgba(74,181,176,0.3)' : 'none',
            }}
          >
            ⏻
          </button>

          {/* Divider */}
          <div style={{
            width: '28px',
            height: '1px',
            background: 'rgba(255,255,255,0.08)',
            margin: '4px 0',
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
                  width: '40px',
                  height: '44px',
                  borderRadius: '10px',
                  border: `1px solid ${isActive ? 'rgba(74,181,176,0.7)' : 'rgba(255,255,255,0.08)'}`,
                  background: isActive ? 'rgba(74,181,176,0.2)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#4ab5b0' : toolsEnabled ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.22)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  cursor: toolsEnabled ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 10px rgba(74,181,176,0.2)' : 'none',
                  fontSize: '14px',
                }}
              >
                <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em', opacity: 0.7 }}>{key}</span>
              </button>
            );
          })}
        </div>

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
                {activeHotspot.facts.map((f, i) => (
                  <div key={i} className="tip-fact">
                    <div className="tip-fact-label">{f.label}</div>
                    <div className="tip-fact-value">{f.value}</div>
                  </div>
                ))}
              </div>
              <div className="tip-tags">
                {activeHotspot.tags.map((t, i) => (
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