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
  const sceneRef = useRef<HTMLDivElement>(null);

  const handleLoaded = useCallback(() => {
    setIsLoaded(true);
  }, []);

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